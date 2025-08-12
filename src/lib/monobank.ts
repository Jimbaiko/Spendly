interface MonobankClient {
  id: string;
  name: string;
  webHookUrl: string;
  permissions: string;
}

interface MonobankAccount {
  id: string;
  sendId: string;
  balance: number;
  creditLimit: number;
  type: string;
  currencyCode: number;
  cashbackType: string;
  maskedPan: string[];
  iban: string;
}

interface MonobankStatement {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc: number;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  comment: string;
  receiptId: string;
  invoiceId: string;
  counterEdrpou: string;
  counterIban: string;
}

interface MonobankClientInfoResponse {
  clientId: string;
  name: string;
  webHookUrl: string;
  permissions: string;
  accounts: MonobankAccount[];
}

interface MonobankStatementResponse extends Array<MonobankStatement> {}

export class MonobankAPI {
  private baseUrl = 'https://api.monobank.ua';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Token': this.token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Monobank API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getClientInfo(): Promise<MonobankClientInfoResponse> {
    return this.makeRequest('/personal/client-info');
  }

  async getStatement(accountId: string, from: number, to?: number): Promise<MonobankStatementResponse> {
    let endpoint = `/personal/statement/${accountId}/${from}`;
    if (to) {
      endpoint += `/${to}`;
    }
    return this.makeRequest(endpoint);
  }
}
