import { RpcClient } from "../utils/rpc-client";

export abstract class BaseService {
  protected rpcClient: RpcClient;

  constructor(rpcUrl: string) {
    this.rpcClient = new RpcClient(rpcUrl);
  }

  /**
   * Makes an RPC call to the blockchain
   */
  async callRPC<T>(
    method: string,
    params: unknown[] = []
  ): Promise<T> {
    try {
      return await this.rpcClient.call<T>(method, params);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `RPC Request failed: ${error.message}`
        );
      }
      throw new Error(
        "RPC Request failed with unknown error"
      );
    }
  }
}
