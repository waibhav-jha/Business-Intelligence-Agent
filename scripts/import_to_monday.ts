/**
 * Monday.com Board Creator & Data Importer Script for Skylark Drones
 * 
 * Usage:
 * export MONDAY_API_KEY="your_api_key_here"
 * npx ts-node scripts/import_to_monday.ts
 */

import { RAW_DEALS_SAMPLE, RAW_WORK_ORDERS_SAMPLE } from '../data/datasets';

const MONDAY_API_URL = 'https://api.monday.com/v2';
const API_KEY = process.env.MONDAY_API_KEY;

async function queryMonday(query: string, variables: any = {}) {
  if (!API_KEY) {
    throw new Error('Please set MONDAY_API_KEY environment variable.');
  }

  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY,
      'API-Version': '2024-04',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Monday GraphQL Error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function main() {
  console.log('🦅 Skylark Drones - Monday.com Auto Board Provisioner');
  console.log('----------------------------------------------------');

  if (!API_KEY) {
    console.error('❌ MONDAY_API_KEY is not set. Please export MONDAY_API_KEY="your_key" and run again.');
    process.exit(1);
  }

  // 1. Verify User
  const meData = await queryMonday('query { me { id name email } }');
  console.log(`✓ Authenticated as ${meData.me.name} (${meData.me.email})`);

  // 2. Create Deals Board
  console.log('Creating "Skylark - Deals Pipeline" board...');
  const createDealsBoard = await queryMonday(`
    mutation {
      create_board(board_name: "Skylark - Deals Pipeline", board_kind: public) {
        id
      }
    }
  `);
  const dealsBoardId = createDealsBoard.create_board.id;
  console.log(`✓ Deals Board created with ID: ${dealsBoardId}`);

  // Create columns for Deals
  console.log('Creating columns on Deals board...');
  await queryMonday(`
    mutation ($boardId: ID!) {
      c1: create_column(board_id: $boardId, title: "Client", column_type: text) { id }
      c2: create_column(board_id: $boardId, title: "Sector", column_type: status) { id }
      c3: create_column(board_id: $boardId, title: "Stage", column_type: status) { id }
      c4: create_column(board_id: $boardId, title: "Deal Value", column_type: numbers) { id }
      c5: create_column(board_id: $boardId, title: "Expected Close Date", column_type: date) { id }
      c6: create_column(board_id: $boardId, title: "Owner", column_type: text) { id }
    }
  `, { boardId: dealsBoardId });

  // 3. Create Work Orders Board
  console.log('Creating "Skylark - Work Order Tracker" board...');
  const createWOBoard = await queryMonday(`
    mutation {
      create_board(board_name: "Skylark - Work Order Tracker", board_kind: public) {
        id
      }
    }
  `);
  const woBoardId = createWOBoard.create_board.id;
  console.log(`✓ Work Orders Board created with ID: ${woBoardId}`);

  // Create columns for Work Orders
  console.log('Creating columns on Work Orders board...');
  await queryMonday(`
    mutation ($boardId: ID!) {
      c1: create_column(board_id: $boardId, title: "Client", column_type: text) { id }
      c2: create_column(board_id: $boardId, title: "Sector", column_type: status) { id }
      c3: create_column(board_id: $boardId, title: "Status", column_type: status) { id }
      c4: create_column(board_id: $boardId, title: "Survey Area", column_type: text) { id }
      c5: create_column(board_id: $boardId, title: "Flight Date", column_type: date) { id }
      c6: create_column(board_id: $boardId, title: "Delivery Date", column_type: date) { id }
      c7: create_column(board_id: $boardId, title: "Billing Status", column_type: status) { id }
      c8: create_column(board_id: $boardId, title: "Issues Log", column_type: text) { id }
    }
  `, { boardId: woBoardId });

  console.log('----------------------------------------------------');
  console.log('🎉 Setup Complete!');
  console.log(`Deals Board ID: ${dealsBoardId}`);
  console.log(`Work Orders Board ID: ${woBoardId}`);
  console.log('You can now plug these IDs into the web app or .env file.');
}

main().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
