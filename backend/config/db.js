import pkg from 'pg';
const { Pool, types } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configurar parser para NUMERIC (OID 1700)
types.setTypeParser(1700, val => parseFloat(val));

// Configurar parser para TIMESTAMP (OID 1114)
// Postgres guarda en UTC pero devuelve string sin zona. 
// Al agregar 'Z', JS ignora el timezone del sistema y lo trata como UTC real.
types.setTypeParser(1114, str => new Date(str + 'Z'));

// Configuración de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Siempre permitir SSL en Neon/Cloud
});

// ✅ FIX: Ejecutar SET search_path al conectar cliente (compatible con Neon Pooler)
pool.on('connect', (client) => {
    client.query('SET search_path TO public')
        .catch(err => console.error('Error setting search_path', err.message));
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
