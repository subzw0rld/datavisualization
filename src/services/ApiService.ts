import type { MetadataResponse, RawEmployeeDataRecord } from '../types';

export class ApiService {
  private static cachedMetadata: MetadataResponse | null = null;

  public static async fetchMetadata(forceRefresh: boolean = false): Promise<MetadataResponse> {
    if (this.cachedMetadata && !forceRefresh) {
      return this.cachedMetadata;
    }

    const response = await fetch('/api/metadata');
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const data: MetadataResponse = await response.json();
    this.cachedMetadata = data;
    return data;
  }

  public static async fetchDataset(type: 'project' | 'team'): Promise<Record<string, RawEmployeeDataRecord>> {
    const response = await fetch(`/api/datasets/${type}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset '${type}': ${response.statusText}`);
    }

    return response.json();
  }

  public static async fetchEmployee(empID: number): Promise<RawEmployeeDataRecord> {
    const response = await fetch(`/api/employees/${empID}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch employee ${empID}: ${response.statusText}`);
    }

    return response.json();
  }

  public static async createEmployee(employee: RawEmployeeDataRecord & { dataset: 'project' | 'team' }): Promise<any> {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });

    if (!response.ok) {
      throw new Error(`Failed to create employee: ${response.statusText}`);
    }

    return response.json();
  }

  public static async updateEmployee(empID: number, updates: Partial<RawEmployeeDataRecord> & { dataset?: 'project' | 'team' }): Promise<any> {
    const response = await fetch(`/api/employees/${empID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update employee: ${response.statusText}`);
    }

    return response.json();
  }

  public static async deleteEmployee(empID: number, dataset?: 'project' | 'team'): Promise<any> {
    const url = dataset ? `/api/employees/${empID}?dataset=${dataset}` : `/api/employees/${empID}`;
    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error(`Failed to delete employee: ${response.statusText}`);
    }

    return response.json();
  }
}
