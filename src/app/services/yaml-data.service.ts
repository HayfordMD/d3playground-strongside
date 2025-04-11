import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import * as yaml from 'js-yaml';

@Injectable({
  providedIn: 'root'
})
export class YamlDataService {
  constructor(private http: HttpClient) {}

  /**
   * Load YAML data from a file in the assets directory
   * @param fileName The name of the YAML file in the assets/data directory
   * @returns Observable with the parsed YAML data or null if there was an error
   */
  loadYamlData<T>(fileName: string): Observable<T | null> {
    const filePath = `assets/data/${fileName}`;
    
    return this.http.get(filePath, { responseType: 'text' })
      .pipe(
        map(text => {
          try {
            return yaml.load(text) as T;
          } catch (e) {
            console.error('Error parsing YAML:', e);
            return null;
          }
        }),
        catchError(err => {
          console.error(`Error loading YAML file ${fileName}:`, err);
          return of(null);
        })
      );
  }
}
