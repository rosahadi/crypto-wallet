export class RpcClient {
  private url: string;
  private id: number = 1;

  /**
   * Creates a new RPC client
   * @param url - The URL of the Ethereum JSON-RPC endpoint
   */
  constructor(url: string) {
    this.url = url;
  }

  /**
   * Makes a JSON-RPC call to the Ethereum node
   * @param method - The RPC method to call
   * @param params - The parameters to pass to the method
   * @returns The result of the RPC call
   */
  async call<T>(
    method: string,
    params: unknown[] = []
  ): Promise<T> {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    });

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(
          `RPC error ${data.error.code}: ${data.error.message}`
        );
      }

      return data.result;
    } catch (error) {
      throw error;
    }
  }
}
