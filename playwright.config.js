import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'node tests/helpers/static-server.js',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
