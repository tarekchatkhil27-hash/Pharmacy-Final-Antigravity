import Papa from 'papaparse';
import { Medicine } from '../types';

let medicineDatabase: Medicine[] | null = null;
let fetchPromise: Promise<Medicine[]> | null = null;

export const getMedicineDatabase = async (): Promise<Medicine[]> => {
  if (medicineDatabase) return medicineDatabase;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/Final-medicines.csv')
    .then(res => res.text())
    .then(csvText => {
      return new Promise<Medicine[]>((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Some CSVs might have slightly different headers, but we assume exact match
            medicineDatabase = results.data as Medicine[];
            resolve(medicineDatabase);
          }
        });
      });
    });

  return fetchPromise;
};
