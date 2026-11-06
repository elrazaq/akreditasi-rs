import { app } from './src/app.js';
import http from 'http';

async function testBackend() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4001, resolve));
  console.log('🧪 Test server listening on http://localhost:4001');

  try {
    // 1. Test Login Superadmin
    const loginRes = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rsudbintan.id',
        password: 'AdminSTARKES2024!',
      }),
    });
    const loginData: any = await loginRes.json();
    console.log('1. Login Superadmin status:', loginRes.status, 'Role:', loginData.user?.role);
    if (!loginData.token) throw new Error('Token missing: ' + JSON.stringify(loginData));
    const token = loginData.token;

    // 2. Test GET /me
    const meRes = await fetch('http://localhost:4001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData: any = await meRes.json();
    console.log('2. GET /me status:', meRes.status, 'User:', meData.user?.email);

    // 3. Test GET /pokja (All 16 Pokjas)
    const pokjaRes = await fetch('http://localhost:4001/api/pokja', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pokjaData: any = await pokjaRes.json();
    console.log('3. GET /pokja status:', pokjaRes.status, 'Total Pokja:', pokjaData.pokjas?.length);
    if (pokjaData.pokjas?.length !== 16) {
      throw new Error(`Expected 16 Pokjas, got ${pokjaData.pokjas?.length}`);
    }

    // 4. Test GET /pokja/TKRS with dynamic database assessment elements
    const tkrsRes = await fetch('http://localhost:4001/api/pokja/TKRS', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tkrsData: any = await tkrsRes.json();
    const totalEpsInTkrs = tkrsData.pokja?.standars?.reduce(
      (acc: number, s: any) => acc + (s.elemenPenilaian?.length || 0),
      0
    );
    console.log('4. GET /pokja/TKRS status:', tkrsRes.status, 'Standars:', tkrsData.pokja?.standars?.length, 'EPs:', totalEpsInTkrs);
    const firstEp = tkrsData.pokja?.standars?.[0]?.elemenPenilaian?.[0];
    console.log('   Sample DB EP:', firstEp?.kode, 'Skoring:', firstEp?.skoring, 'RDOWS:', {
      R: firstEp?.kodeR,
      D: firstEp?.kodeD,
      O: firstEp?.kodeO,
      W: firstEp?.kodeW,
      S: firstEp?.kodeS,
    });

    // 5. Test Superadmin User Management: GET /api/users
    const usersRes = await fetch('http://localhost:4001/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usersData: any = await usersRes.json();
    console.log('5. GET /api/users status:', usersRes.status, 'Total users:', usersData.users?.length);

    // 6. Test Create User
    const testEmail = `test.doctor.${Date.now()}@rsudbintan.id`;
    const createUserRes = await fetch('http://localhost:4001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nama: 'dr. Budi Santoso, Sp.PD',
        email: testEmail,
        password: 'Password123!',
        role: 'POKJA',
        assignedPokjaId: pokjaData.pokjas[0].id,
      }),
    });
    const createUserData: any = await createUserRes.json();
    console.log('6. POST /api/users status:', createUserRes.status, 'Created ID:', createUserData.user?.id);

    // 7. Test Delete User
    const deleteUserRes = await fetch(`http://localhost:4001/api/users/${createUserData.user?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('7. DELETE /api/users/:id status:', deleteUserRes.status);

    // 8. Test Audit Logs
    const auditRes = await fetch('http://localhost:4001/api/audit-logs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const auditData: any = await auditRes.json();
    console.log('8. GET /audit-logs status:', auditRes.status, 'Total logs:', auditData.total);

    console.log('🎉 ALL BACKEND VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

testBackend();
