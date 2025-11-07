// scripts/generate-test-data.ts
// Generate realistic test data for Yaico development

import { faker } from '@faker-js/faker/locale/nl';
import { 
  TransactionSchema, 
  ClientSchema, 
  type Transaction, 
  type Client 
} from '../src/lib/types/schemas';

// Dutch company names for realistic data
const DUTCH_COMPANIES = [
  { name: 'KPN', category: 'utilities', type: 'b2b' },
  { name: 'Ziggo', category: 'utilities', type: 'b2b' },
  { name: 'Vattenfall', category: 'utilities', type: 'b2b' },
  { name: 'Albert Heijn', category: 'groceries', type: 'b2c' },
  { name: 'Jumbo', category: 'groceries', type: 'b2c' },
  { name: 'Bol.com', category: 'shopping', type: 'b2c' },
  { name: 'Coolblue', category: 'electronics', type: 'b2c' },
  { name: 'NS', category: 'transport', type: 'b2c' },
  { name: 'GVB', category: 'transport', type: 'b2c' },
  { name: 'Transavia', category: 'transport', type: 'b2c' },
  { name: 'ANWB', category: 'insurance', type: 'b2c' },
  { name: 'Nationale Nederlanden', category: 'insurance', type: 'b2b' },
  { name: 'ABN AMRO', category: 'banking', type: 'b2b' },
  { name: 'ING Bank', category: 'banking', type: 'b2b' },
  { name: 'Rabobank', category: 'banking', type: 'b2b' },
];

// Transaction descriptions templates
const TRANSACTION_TEMPLATES = {
  income: [
    'Factuur #{number} - {service}',
    'Consultancy uren week {week}',
    'Project {project} - milestone {milestone}',
    'Retainer {month} {year}',
    'Workshop {topic}',
    'Speaking fee - {event}',
  ],
  expense: [
    'Kantoorartikelen',
    'Software licentie - {software}',
    'Zakelijke lunch - {restaurant}',
    'Reiskosten - {destination}',
    'Marketing - {campaign}',
    'Accountant - {service}',
    'Co-working space - {month}',
    'Hardware - {item}',
  ],
};

// Dutch services for freelancers
const SERVICES = [
  'Web Development',
  'UX Design',
  'Marketing Consultancy',
  'Financial Advisory',
  'Legal Services',
  'Translation Services',
  'Photography',
  'Content Creation',
  'SEO Optimization',
  'Data Analysis',
];

// Generate Dutch IBAN
function generateDutchIBAN(): string {
  const bankCode = faker.helpers.arrayElement(['ABNA', 'RABO', 'INGB', 'KNAB', 'BUNQ']);
  const accountNumber = faker.string.numeric(10);
  const checkDigits = faker.string.numeric(2);
  return `NL${checkDigits}${bankCode}${accountNumber}`;
}

// Generate Dutch VAT number
function generateDutchVATNumber(): string {
  const numbers = faker.string.numeric(9);
  const suffix = `B${faker.string.numeric(2)}`;
  return `NL${numbers}${suffix}`;
}

// Generate realistic transaction amount
function generateAmount(type: 'income' | 'expense'): number {
  if (type === 'income') {
    // Freelance income typically between €500 - €10000
    const base = faker.number.int({ min: 5, max: 100 }) * 100;
    return base + faker.number.float({ min: 0, max: 0.99, precision: 0.01 });
  } else {
    // Expenses typically between €10 - €2000
    const base = faker.number.int({ min: 10, max: 2000 });
    return -(base + faker.number.float({ min: 0, max: 0.99, precision: 0.01 }));
  }
}

// Generate client
export function generateClient(userId: string): Partial<Client> {
  const isCompany = faker.datatype.boolean();
  const country = faker.helpers.weightedArrayElement([
    { value: 'NL', weight: 70 },
    { value: 'DE', weight: 10 },
    { value: 'BE', weight: 10 },
    { value: 'FR', weight: 5 },
    { value: 'US', weight: 5 },
  ]);

  return {
    id: faker.string.uuid(),
    userId,
    clientName: isCompany 
      ? faker.company.name() 
      : `${faker.person.firstName()} ${faker.person.lastName()}`,
    clientType: isCompany ? 'company' : 'individual',
    classification: isCompany ? 'b2b' : 'b2c',
    countryCode: country,
    vatNumber: isCompany && country !== 'US' ? generateDutchVATNumber() : undefined,
    email: faker.internet.email(),
    invoiceEmail: faker.internet.email(),
    paymentTermsDays: faker.helpers.arrayElement([14, 21, 30, 45, 60]),
    preferredPaymentMethod: faker.helpers.arrayElement(['bank_transfer', 'ideal', 'creditcard']),
    tags: faker.helpers.arrayElements(
      ['regular', 'priority', 'new', 'enterprise', 'startup'],
      { min: 0, max: 3 }
    ),
    active: faker.datatype.boolean({ probability: 0.9 }),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent({ days: 30 }),
  };
}

// Generate transaction
export function generateTransaction(
  userId: string,
  clients: Client[]
): Partial<Transaction> {
  const isIncome = faker.datatype.boolean({ probability: 0.3 }); // 30% income, 70% expenses
  const status = faker.helpers.weightedArrayElement([
    { value: 'approved', weight: 60 },
    { value: 'pending_review', weight: 20 },
    { value: 'processing', weight: 10 },
    { value: 'draft', weight: 5 },
    { value: 'error', weight: 5 },
  ]);

  const hasAI = status !== 'draft';
  const certainty = hasAI 
    ? faker.number.float({ min: 0.5, max: 1, precision: 0.01 })
    : undefined;

  let description: string;
  let category: string | undefined;

  if (isIncome) {
    const template = faker.helpers.arrayElement(TRANSACTION_TEMPLATES.income);
    description = template
      .replace('{number}', faker.string.numeric(4))
      .replace('{service}', faker.helpers.arrayElement(SERVICES))
      .replace('{week}', faker.string.numeric(2))
      .replace('{project}', faker.company.buzzNoun())
      .replace('{milestone}', faker.string.numeric(1))
      .replace('{month}', faker.date.month())
      .replace('{year}', '2024')
      .replace('{topic}', faker.company.buzzPhrase())
      .replace('{event}', faker.company.catchPhrase());
    category = 'income';
  } else {
    const company = faker.helpers.arrayElement(DUTCH_COMPANIES);
    description = `${company.name} - ${faker.commerce.productDescription()}`;
    category = company.category;
  }

  const transaction: Partial<Transaction> = {
    id: faker.string.uuid(),
    userId,
    amount: generateAmount(isIncome ? 'income' : 'expense'),
    currency: 'EUR',
    description,
    status,
    source: faker.helpers.arrayElement(['manual', 'bank_import', 'invoice_scan', 'api']),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 7 }),
    createdBy: userId,
    lastModifiedBy: userId,
    version: 1,
  };

  // Add client for income transactions
  if (isIncome && clients.length > 0) {
    const client = faker.helpers.arrayElement(clients);
    transaction.clientId = client.id;
  }

  // Add AI analysis
  if (hasAI && certainty) {
    transaction.aiAnalysis = {
      suggestedCategory: category || 'other',
      certaintyScore: certainty,
      modelVersion: '1.0.0',
      processingTimeMs: faker.number.int({ min: 100, max: 2000 }),
      alternativeCategories: certainty < 0.9 ? [
        {
          category: faker.helpers.arrayElement(['other', 'misc', 'business']),
          score: faker.number.float({ min: 0.1, max: certainty - 0.1, precision: 0.01 }),
        }
      ] : undefined,
    };
  }

  // Add tax details for approved transactions
  if (status === 'approved' && !isIncome) {
    const vatRate = 21; // Dutch standard VAT
    const netAmount = Math.abs(transaction.amount!);
    const vatAmount = netAmount * (vatRate / 100);
    
    transaction.taxDetails = {
      vatRate,
      vatAmount,
      deductible: faker.datatype.boolean({ probability: 0.8 }),
      taxYear: new Date().getFullYear(),
      quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1}` as any,
    };
  }

  return transaction;
}

// Generate bank transactions for import simulation
export function generateBankImport(count: number = 10) {
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const isDebit = faker.datatype.boolean({ probability: 0.7 });
    const company = faker.helpers.arrayElement(DUTCH_COMPANIES);
    
    transactions.push({
      date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      description: `${company.name} ${faker.commerce.productDescription()}`,
      amount: isDebit 
        ? -faker.number.float({ min: 10, max: 500, precision: 0.01 })
        : faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
      balance: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }),
      counterparty: company.name,
      iban: generateDutchIBAN(),
    });
  }
  
  return transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Generate complete test dataset
export async function generateTestDataset(userId: string) {
  console.log('🎲 Generating test data for Yaico...');
  
  // Generate clients
  const clients: Client[] = [];
  const clientCount = faker.number.int({ min: 5, max: 15 });
  
  console.log(`📋 Generating ${clientCount} clients...`);
  for (let i = 0; i < clientCount; i++) {
    const client = ClientSchema.parse(generateClient(userId));
    clients.push(client);
  }
  
  // Generate transactions
  const transactions: Transaction[] = [];
  const transactionCount = faker.number.int({ min: 50, max: 200 });
  
  console.log(`💰 Generating ${transactionCount} transactions...`);
  for (let i = 0; i < transactionCount; i++) {
    const transaction = TransactionSchema.parse(
      generateTransaction(userId, clients)
    );
    transactions.push(transaction);
  }
  
  // Calculate statistics
  const stats = {
    totalIncome: transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    clientCount: clients.length,
    transactionCount: transactions.length,
    averageTransactionValue: 
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length,
  };
  
  console.log('\n📊 Dataset Statistics:');
  console.log(`   Total Income: €${stats.totalIncome.toFixed(2)}`);
  console.log(`   Total Expenses: €${stats.totalExpenses.toFixed(2)}`);
  console.log(`   Net Profit: €${(stats.totalIncome - stats.totalExpenses).toFixed(2)}`);
  console.log(`   Clients: ${stats.clientCount}`);
  console.log(`   Transactions: ${stats.transactionCount}`);
  console.log(`   Avg Transaction: €${stats.averageTransactionValue.toFixed(2)}`);
  
  return {
    clients,
    transactions,
    stats,
    bankImport: generateBankImport(20),
  };
}

// CLI execution
if (require.main === module) {
  const userId = faker.string.uuid();
  generateTestDataset(userId).then(data => {
    // Save to JSON files
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'clients.json'),
      JSON.stringify(data.clients, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'transactions.json'),
      JSON.stringify(data.transactions, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'bank-import.csv'),
      'Date,Description,Amount,Balance,Counterparty,IBAN\n' +
      data.bankImport.map(t => 
        `${t.date},"${t.description}",${t.amount},${t.balance},"${t.counterparty}",${t.iban}`
      ).join('\n')
    );
    
    console.log('\n✅ Test data saved to ./test-data/');
  });
}
