import http from 'http';

async function main() {
    const testCases = [
        '/categories/%D8%A8%D8%B1%D8%A7%D9%85%D8%AC',  // encoded برامج
        '/categories/' + encodeURIComponent('برامج'),
        '/categories/%D9%84%D8%A7%D8%A8%D8%AA%D9%88%D8%A8%D8%A7%D8%AA-%D9%88%D8%AD%D8%A7%D8%B3%D8%A8%D8%A7%D8%AA',
        '/categories',
        '/',
    ];
    
    for (const path of testCases) {
        try {
            const result = await new Promise((resolve, reject) => {
                http.get('http://localhost:3000' + path, (res) => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve({ status: res.statusCode, length: d.length }));
                }).on('error', reject);
            });
            console.log(path, '-> Status:', result.status, '| Length:', result.length);
        } catch(e) {
            console.log(path, '-> Error:', e.message);
        }
    }
}

main().catch(console.error);
