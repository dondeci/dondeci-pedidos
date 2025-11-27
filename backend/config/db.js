import pkg from 'pg';
const { Pool, types } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configurar parser para NUMERIC (OID 1700)
types.setTypeParser(1700, val => parseFloat(val));

// Configuración de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Funciones helper para promisificar
export const getAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result.rows[0]);
        });
    });
};

export const allAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result.rows);
        });
    });
};

export const runAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

export default pool;
