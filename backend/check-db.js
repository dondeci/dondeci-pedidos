import pool from './config/db.js';

const checkDb = async () => {
    try {
        console.log('Checking item_time_stats table...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'item_time_stats';
        `);

        if (res.rows.length === 0) {
            console.log('❌ Table item_time_stats does NOT exist!');
        } else {
            console.log('✅ Table item_time_stats exists with columns:');
            console.table(res.rows);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking DB:', error);
        process.exit(1);
    }
};

checkDb();
