//@ts-check

/**
 * This module contains functions to parse different
 * data models from request bodies.
 * @module utils/bodyParser
 */

/**
 * Parses and returns post data from the request body.
 * Extra fields are added to the field extras.
 * @type {import("../types").BodyParser}
 * @param {Object} requestBody The request body to parse.
 * @returns {Object} Parsed request body.
 */
export const postParser = ({
  title,
  description,
  category,
  askingPrice,
  deliveryType,
  ...extras
}) => ({ title, description, category, askingPrice, deliveryType, extras });

/**
 * Parses and returns user data from the request body.
 * Extra fields are added to the field extras.
 * @type {import("../types").BodyParser}
 * @param {Object} requestBody The request body to parse.
 * @return {Object} Parsed request body.
 */
export const userParser = ({
  email,
  username,
  address,
  phoneNumber,
  birthDate,
  password,
  ...extras
}) => ({ email, username, address, phoneNumber, birthDate, password, extras });

/**
 * Parses and returs login data from the request body.
 * Extra fields are added to the field extras.
 * @type {import("../types").BodyParser}
 * @param {Object} requestBody The request body to parse.
 * @return {Object} Parsed request body.
 */
export const loginParser = ({ username, password, ...extras }) => ({
  username,
  password,
  extras,
});

export const locationParser = ({
  city,
  country,
  postalCode,
  street,
  ...extras
}) => ({
  city,
  country,
  postalCode,
  street,
});

export default { postParser, userParser };
