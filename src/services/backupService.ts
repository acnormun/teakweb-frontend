/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from 'axios';
import { Agrupamento } from 'src/types/agrupamento.type';

class BackupService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3030',
    });
  }

  public async getBackupData(): Promise<Agrupamento[]> {
    try {
      const response = await this.api.get('/backup_20062024');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar os dados do backup:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService();
