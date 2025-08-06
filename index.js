#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();
const dataFile = path.join(__dirname, 'data.json');

function loadExpenses() {
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, '[]'); // crea archivo vacío
        return [];
    }

    const content = fs.readFileSync(dataFile, 'utf-8').trim();
    if (!content) {
        return [];
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        console.error('Error: data.json está corrupto. Se reiniciará.');
        fs.writeFileSync(dataFile, '[]');
        return [];
    }
}


function saveExpenses(expenses) {
    fs.writeFileSync(dataFile, JSON.stringify(expenses, null, 2));
}

function getNewId(expenses) {
    return expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
}

program
  .command('add')
  .description('Add a new expense')
  .requiredOption('--description <desc>', 'Description of the expense')
  .requiredOption('--amount <amount>', 'Amount of the expense')
  .action((options) => {
      if (!options.description.trim()) {
          console.log('Error: Description cannot be empty.');
          return;
      }

      const amount = parseFloat(options.amount);
      if (isNaN(amount) || amount <= 0) {
          console.log('Error: Amount must be a positive number.');
          return;
      }

      const expenses = loadExpenses();
      const id = getNewId(expenses);
      const expense = {
          id,
          date: new Date().toISOString().split('T')[0],
          description: options.description,
          amount
      };
      expenses.push(expense);
      saveExpenses(expenses);
      console.log(`Expense added successfully (ID: ${id})`);
  });

  program
  .command('list')
  .description('List all expenses')
  .action(() => {
      const expenses = loadExpenses();
      if (expenses.length === 0) {
          console.log('No expenses found.');
          return;
      }
      console.log('ID   Date        Description    Amount');
      expenses.forEach(e => {
          console.log(`${e.id}   ${e.date}   ${e.description}    $${e.amount}`);
      });
  });


  program
  .command('delete')
  .description('Delete an expense by ID')
  .requiredOption('--id <id>', 'Expense ID')
  .action((options) => {
      const expenses = loadExpenses();
      const expenseId = parseInt(options.id);
      if (isNaN(expenseId)) {
          console.log('Error: ID must be a number.');
          return;
      }

      const index = expenses.findIndex(e => e.id === expenseId);
      if (index === -1) {
          console.log(`Error: Expense with ID ${expenseId} not found.`);
          return;
      }

      expenses.splice(index, 1);
      saveExpenses(expenses);
      console.log('Expense deleted successfully');
  });

  program
  .command('update')
  .description('Update an expense by ID')
  .requiredOption('--id <id>', 'Expense ID')
  .option('--description <desc>', 'New description')
  .option('--amount <amount>', 'New amount')
  .action((options) => {
      let expenses = loadExpenses();
      const expenseId = parseInt(options.id);
      if (isNaN(expenseId)) {
          console.log('Error: ID must be a number.');
          return;
      }

      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
          console.log(`Error: Expense with ID ${expenseId} not found.`);
          return;
      }

      if (options.description) {
          if (!options.description.trim()) {
              console.log('Error: Description cannot be empty.');
              return;
          }
          expense.description = options.description;
      }

      if (options.amount) {
          const amount = parseFloat(options.amount);
          if (isNaN(amount) || amount <= 0) {
              console.log('Error: Amount must be a positive number.');
              return;
          }
          expense.amount = amount;
      }

      saveExpenses(expenses);
      console.log(`Expense updated successfully (ID: ${expenseId})`);
  });

  program
  .command('summary')
  .description('Show total expenses or for a specific month')
  .option('--month <month>', 'Month number (1-12)')
  .action((options) => {
      const expenses = loadExpenses();
      let total;

      if (options.month) {
          const month = parseInt(options.month);
          if (isNaN(month) || month < 1 || month > 12) {
              console.log('Error: Month must be between 1 and 12.');
              return;
          }

          total = expenses
              .filter(e => new Date(e.date).getMonth() + 1 === month)
              .reduce((sum, e) => sum + e.amount, 0);
          console.log(`Total expenses for month ${month}: $${total}`);
      } else {
          total = expenses.reduce((sum, e) => sum + e.amount, 0);
          console.log(`Total expenses: $${total}`);
      }
  });

  program.parse(process.argv);
