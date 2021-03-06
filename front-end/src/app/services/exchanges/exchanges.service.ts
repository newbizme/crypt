import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EntitiesFilter } from '../../shared/models/api/entitiesFilter';
import { environment } from '../../../environments/environment';

export class ExchangesAllResponse {
  exchanges: Array<any>;
  status: boolean;
  count: number;
}

export class ExchangesInstrumentIdentifiersResponse {
  identifiers: Array<string>;
  success: boolean;
}

@Injectable()
export class ExchangesService {
  private baseUrl: string = environment.baseUrl;

  constructor(
    private http: HttpClient,
  ) {}

  getAllExchanges(request?: EntitiesFilter): Observable<ExchangesAllResponse>{
    if (request) {
      return this.http.post<ExchangesAllResponse>(this.baseUrl + `exchanges/all`, request);
    } else {
      return this.http.get<ExchangesAllResponse>(this.baseUrl + `exchanges/all`);
    }
  }

  getExchangeInstrumentIdentifiers(exchangeId): Observable<ExchangesInstrumentIdentifiersResponse>{
    return this.http.get<ExchangesInstrumentIdentifiersResponse>(this.baseUrl + `exchanges/${exchangeId}/instruments`);
  }

}
