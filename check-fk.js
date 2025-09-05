const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '852456AA',
  database: 'homemade',
});

async function checkForeignKeys() {
  try {
    await dataSource.initialize();
    
    // Check for foreign key constraints on address table
    const result = await dataSource.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'address' 
        AND tc.constraint_type = 'FOREIGN KEY';
    `);
    
    if (result.length > 0) {
      console.log('Foreign key constraints found on address table:');
      console.table(result);
    } else {
      console.log('No foreign key constraints found on address table');
    }
    
    // Also check the column structure
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'address' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns in address table:');
    console.table(columns);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkForeignKeys();