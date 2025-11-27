export interface User {
  id: number; // mandatory
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: any;
}
