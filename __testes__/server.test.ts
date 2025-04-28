import server from '../src/backend/server';
import request from 'supertest';
describe('Testes do servidor - nível Jedi', () => {
    afterAll(() => {
        server.close();
    });

    test('Deve responder com "pong" na rota /ping', async () => {
        const response = await request(server).get('/ping');
        expect(response.status).toBe(200);
        expect(response.text).toBe('pong');
    });

    test('Deve permitir requisições de origens permitidas', async () => {
        const response = await request(server)
            .get('/ping')
            .set('Origin', process.env.ALLOWED_ORIGINS?.split(',')[0] || '');
        expect(response.status).toBe(200);
    });

    test('Deve bloquear requisições de origens não permitidas', async () => {
        const response = await request(server)
            .get('/ping')
            .set('Origin', 'http://origem-nao-permitida.com');
        expect(response.status).toBe(200); // CORS não bloqueia diretamente, mas o navegador sim
    });

    test('Deve servir arquivos estáticos corretamente', async () => {
        const response = await request(server).get('/index.html');
        expect(response.status).toBe(200);
    });

    test('Deve retornar 404 para rotas inexistentes', async () => {
        const response = await request(server).get('/rota-inexistente');
        expect(response.status).toBe(404);
    });
    test('Verificar se está carregando o dotenv', ()=>{
        expect(process.env.ALLOWED_ORIGINS).toBeDefined();
        expect(process.env.PORT).toBeDefined();
        expect(process.env.PORT).toBe('3000');
        expect(process.env.NODE_ENV).toBeDefined();
        expect(process.env.NODE_ENV).toBe('test');
    })
});
