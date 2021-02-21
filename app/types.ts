/**
 * These type declarations are mainly used
 * to enable VSCode JSDoc features.
 */
import { ObjectID } from 'mongodb';

export type BodyParser = (body: Object) => { extras: Object };

export type ErrorType = {
  strCode: string;
  code: number;
  message: string;
};

export interface ResponseError extends Error {}

export type Category =
  | 'computers'
  | 'electronics'
  | 'cars'
  | 'pets'
  | 'food'
  | 'drinks';

export type DeliveryType = {
  shipping: boolean;
  pickup: boolean;
};

export type Address = {
  city: string;
  country: string;
  postalCode: string;
  street: string;
};

export type Seller = {
  email: string;
  phoneNumber: string;
  username: string;
};

export interface User extends Seller {
  passwordHash?: string;
  id?: ObjectID;
  birthDate: Date;
  creationDate?: Date;
  address: Address;
  password?: string;
}

export interface Post {
  id?: ObjectID;
  seller?: Seller;
  description: string;
  title: string;
  category: Category;
  askingPrice: number;
  deliveryType: DeliveryType;
  posted?: Date;
  location?: Address;
  imageUrls?: string[];
}
