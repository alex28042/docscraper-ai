import { describe, it, expect } from 'vitest';
import { extractApiEndpoints } from '../../../src/parsing/api-extractor';

describe('extractApiEndpoints', () => {
  it('extracts endpoints from plain text', () => {
    const html = `
      <html><body>
        <p>GET /api/users - List all users</p>
        <p>POST /api/users - Create a user</p>
      </body></html>
    `;
    const endpoints = extractApiEndpoints(html);
    expect(endpoints).toHaveLength(2);
    expect(endpoints[0]).toMatchObject({ method: 'GET', path: '/api/users' });
    expect(endpoints[1]).toMatchObject({ method: 'POST', path: '/api/users' });
  });

  it('extracts endpoints from code blocks', () => {
    const html = `
      <html><body>
        <pre><code>DELETE /api/users/:id</code></pre>
      </body></html>
    `;
    const endpoints = extractApiEndpoints(html);
    expect(endpoints.length).toBeGreaterThanOrEqual(1);
    expect(endpoints.some((e) => e.method === 'DELETE' && e.path === '/api/users/:id')).toBe(true);
  });

  it('deduplicates endpoints', () => {
    const html = `
      <html><body>
        <p>GET /api/users</p>
        <code>GET /api/users</code>
        <p>GET /api/users again</p>
      </body></html>
    `;
    const endpoints = extractApiEndpoints(html);
    const getUsers = endpoints.filter((e) => e.method === 'GET' && e.path === '/api/users');
    expect(getUsers).toHaveLength(1);
  });

  it('extracts all HTTP methods', () => {
    const html = `
      <html><body>
        <p>GET /resource</p>
        <p>POST /resource</p>
        <p>PUT /resource/:id</p>
        <p>PATCH /resource/:id</p>
        <p>DELETE /resource/:id</p>
      </body></html>
    `;
    const endpoints = extractApiEndpoints(html);
    const methods = endpoints.map((e) => e.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('PATCH');
    expect(methods).toContain('DELETE');
  });

  it('returns empty array for pages without API endpoints', () => {
    const html = `<html><body><p>Just a normal page</p></body></html>`;
    const endpoints = extractApiEndpoints(html);
    expect(endpoints).toEqual([]);
  });

  it('extracts parameters from tables', () => {
    const html = `
      <html><body>
        <p>POST /api/users</p>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td>email</td><td>string</td><td>yes</td><td>User email</td></tr>
            <tr><td>name</td><td>string</td><td>no</td><td>User name</td></tr>
          </tbody>
        </table>
      </body></html>
    `;
    const endpoints = extractApiEndpoints(html);
    const postEndpoint = endpoints.find((e) => e.method === 'POST');
    expect(postEndpoint).toBeDefined();
    expect(postEndpoint!.params).toHaveLength(2);
    expect(postEndpoint!.params[0]).toMatchObject({
      name: 'email',
      type: 'string',
      required: true,
      description: 'User email',
    });
  });
});
