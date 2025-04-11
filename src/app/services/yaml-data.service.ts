import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import * as yaml from 'js-yaml';

export interface YamlDataResult<T> {
  data: T | null;
  filePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class YamlDataService {
  constructor(private http: HttpClient) {}

  /**
   * Get the relative path to a file in the assets directory
   * @param fileName The name of the YAML file in the assets/data directory
   * @returns The relative path to the file
   */
  getFilePath(fileName: string): string {
    const filePath = `assets/data/${fileName}`;
    console.log('Generated file path:', filePath);
    return filePath;
  }

  /**
   * Load YAML data from a file in the assets directory
   * @param fileName The name of the YAML file in the assets/data directory
   * @returns Observable with the parsed YAML data or null if there was an error
   */
  loadYamlData<T>(fileName: string): Observable<T | null> {
    const filePath = this.getFilePath(fileName);
    
    return this.http.get(filePath, { responseType: 'text' })
      .pipe(
        map(text => {
          try {
            // Set options to suppress errors and continue parsing
            const options = {
              schema: yaml.DEFAULT_SCHEMA,
              onWarning: (e: any) => console.warn('YAML warning:', e),
              json: true // Force JSON compatible output
            };
            return yaml.load(text, options) as T;
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

  /**
   * Load YAML data from a file in the assets directory and include the file path
   * @param fileName The name of the YAML file in the assets/data directory
   * @returns Observable with both the parsed YAML data and the file path
   */
  loadYamlDataWithPath<T>(fileName: string): Observable<YamlDataResult<T>> {
    const filePath = this.getFilePath(fileName);
    console.log('Loading YAML with path:', filePath);
    
    return this.http.get(filePath, { responseType: 'text' })
      .pipe(
        map(text => {
          try {
            // Set options to suppress errors and continue parsing
            const options = {
              schema: yaml.DEFAULT_SCHEMA,
              onWarning: (e: any) => console.warn('YAML warning:', e),
              json: true // Force JSON compatible output
            };
            const result = {
              data: yaml.load(text, options) as T,
              filePath: filePath
            };
            console.log('YAML data loaded successfully with path:', result);
            return result;
          } catch (e) {
            console.error('Error parsing YAML:', e);
            const errorResult = {
              data: null,
              filePath: filePath
            };
            console.log('Error result with path:', errorResult);
            return errorResult;
          }
        }),
        catchError(err => {
          console.error(`Error loading YAML file ${fileName}:`, err);
          const catchResult = {
            data: null,
            filePath: filePath
          };
          console.log('Catch error result with path:', catchResult);
          return of(catchResult);
        })
      );
  }
}
