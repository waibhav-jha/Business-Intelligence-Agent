import { RawDeal, RawWorkOrder } from '../types';

export interface MondayBoardItem {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    text: string | null;
    value: string | null;
    type?: string;
  }>;
}

export interface MondayBoardData {
  id: string;
  name: string;
  columns: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  items: MondayBoardItem[];
}

export class MondayClient {
  private apiKey: string;
  private baseUrl = 'https://api.monday.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async queryGraphQL(query: string, variables: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Monday.com API key is not provided');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        'API-Version': '2024-04',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Monday.com API HTTP Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Monday.com GraphQL Error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data.data;
  }

  /**
   * Test API Key validity.
   */
  async testConnection(): Promise<{ success: boolean; user?: { id: string; name: string; email: string }; error?: string }> {
    try {
      const data = await this.queryGraphQL(`
        query {
          me {
            id
            name
            email
          }
        }
      `);
      return { success: true, user: data.me };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * List boards in the user's workspace.
   */
  async getBoards(): Promise<Array<{ id: string; name: string; items_count?: number }>> {
    const data = await this.queryGraphQL(`
      query {
        boards(limit: 50) {
          id
          name
        }
      }
    `);
    return data.boards || [];
  }

  /**
   * Fetch board schema and items dynamically.
   */
  async getBoardData(boardId: string): Promise<MondayBoardData> {
    const data = await this.queryGraphQL(
      `
      query GetBoardDetails($boardId: [ID!]) {
        boards(ids: $boardId) {
          id
          name
          columns {
            id
            title
            type
          }
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
                type
              }
            }
          }
        }
      }
    `,
      { boardId: [boardId] }
    );

    if (!data.boards || data.boards.length === 0) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    const board = data.boards[0];
    return {
      id: board.id,
      name: board.name,
      columns: board.columns || [],
      items: board.items_page?.items || [],
    };
  }

  /**
   * Transform Monday Deal Board items into RawDeal objects using column title heuristics.
   */
  parseDealsFromBoard(boardData: MondayBoardData): RawDeal[] {
    const colMap: Record<string, string> = {};

    boardData.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('client') || title.includes('customer') || title.includes('account')) colMap['client'] = col.id;
      else if (title.includes('sector') || title.includes('industry') || title.includes('vertical')) colMap['sector'] = col.id;
      else if (title.includes('stage') || title.includes('status') || title.includes('pipeline stage')) colMap['stage'] = col.id;
      else if (title.includes('value') || title.includes('amount') || title.includes('acv') || title.includes('deal value')) colMap['value'] = col.id;
      else if (title.includes('close') || title.includes('date') || title.includes('timeline') || title.includes('expected close')) colMap['expectedCloseDate'] = col.id;
      else if (title.includes('probabilit') || title.includes('prob') || title.includes('%')) colMap['probability'] = col.id;
      else if (title.includes('owner') || title.includes('rep') || title.includes('assignee') || title.includes('lead')) colMap['owner'] = col.id;
      else if (title.includes('region') || title.includes('location') || title.includes('state')) colMap['region'] = col.id;
      else if (title.includes('note') || title.includes('remark') || title.includes('comment')) colMap['notes'] = col.id;
    });

    return boardData.items.map(item => {
      const getVal = (fieldKey: string): string => {
        const colId = colMap[fieldKey];
        if (!colId) return '';
        const colVal = item.column_values.find(c => c.id === colId);
        return colVal?.text || '';
      };

      return {
        id: item.id,
        name: item.name,
        client: getVal('client') || item.name,
        sector: getVal('sector') || '',
        stage: getVal('stage') || '',
        value: getVal('value') || '0',
        expectedCloseDate: getVal('expectedCloseDate') || '',
        probability: getVal('probability') || '',
        owner: getVal('owner') || 'Unassigned',
        region: getVal('region') || '',
        notes: getVal('notes') || '',
      };
    });
  }

  /**
   * Transform Monday Work Orders Board items into RawWorkOrder objects.
   */
  parseWorkOrdersFromBoard(boardData: MondayBoardData): RawWorkOrder[] {
    const colMap: Record<string, string> = {};

    boardData.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('client') || title.includes('customer') || title.includes('account')) colMap['client'] = col.id;
      else if (title.includes('deal') || title.includes('ref')) colMap['dealRef'] = col.id;
      else if (title.includes('sector') || title.includes('industry')) colMap['sector'] = col.id;
      else if (title.includes('status') || title.includes('state') || title.includes('stage')) colMap['status'] = col.id;
      else if (title.includes('area') || title.includes('survey') || title.includes('km') || title.includes('acre')) colMap['surveyAreaKm2'] = col.id;
      else if (title.includes('flight') || title.includes('fly date')) colMap['flightDate'] = col.id;
      else if (title.includes('delivered') || title.includes('delivery date') || title.includes('actual delivery')) colMap['deliveryDate'] = col.id;
      else if (title.includes('expected') || title.includes('target delivery') || title.includes('due')) colMap['expectedDeliveryDate'] = col.id;
      else if (title.includes('billing') || title.includes('invoice') || title.includes('payment')) colMap['billingStatus'] = col.id;
      else if (title.includes('lead') || title.includes('pilot') || title.includes('ops') || title.includes('assignee')) colMap['opsLead'] = col.id;
      else if (title.includes('drone') || title.includes('model') || title.includes('uav')) colMap['droneModel'] = col.id;
      else if (title.includes('delay') || title.includes('weather')) colMap['weatherDelayDays'] = col.id;
      else if (title.includes('issue') || title.includes('log') || title.includes('note')) colMap['issuesLog'] = col.id;
    });

    return boardData.items.map(item => {
      const getVal = (fieldKey: string): string => {
        const colId = colMap[fieldKey];
        if (!colId) return '';
        const colVal = item.column_values.find(c => c.id === colId);
        return colVal?.text || '';
      };

      return {
        id: item.id,
        name: item.name,
        client: getVal('client') || item.name,
        dealRef: getVal('dealRef') || '',
        sector: getVal('sector') || '',
        status: getVal('status') || '',
        surveyAreaKm2: getVal('surveyAreaKm2') || '',
        flightDate: getVal('flightDate') || '',
        deliveryDate: getVal('deliveryDate') || '',
        expectedDeliveryDate: getVal('expectedDeliveryDate') || '',
        billingStatus: getVal('billingStatus') || '',
        opsLead: getVal('opsLead') || 'Ops Team',
        droneModel: getVal('droneModel') || '',
        weatherDelayDays: getVal('weatherDelayDays') || '0',
        issuesLog: getVal('issuesLog') || '',
      };
    });
  }

  /**
   * Fetch and parse both deals and work orders from live Monday boards.
   */
  async syncLiveBoards(
    dealsBoardId: string,
    workOrdersBoardId: string
  ): Promise<{ rawDeals: RawDeal[]; rawWorkOrders: RawWorkOrder[] }> {
    const dealsBoard = await this.getBoardData(dealsBoardId);
    const woBoard = await this.getBoardData(workOrdersBoardId);
    const rawDeals = this.parseDealsFromBoard(dealsBoard);
    const rawWorkOrders = this.parseWorkOrdersFromBoard(woBoard);
    return { rawDeals, rawWorkOrders };
  }
}
