export interface Config {
  host: string;
  user: string;
  password: string;
  database: string;
  [key: string]: any;
};

// ===================
//     DB Error Code
// ===================

/**
 * Error code when host denied access.
 * Cause:
 *  - Wrong password.
 */
export const AccessDenied = 'ER_ACCESS_DENIED_ERROR';

/**
 * Error code when the table expect a value but not supplied.
 */
export const NoDefaultValue = 'ER_NO_DEFAULT_FOR_FIELD';

/**
 * Error code when;
 *  - field doesn't exist in table.
 *  - value supplied is incompatible type.
 */
export const FieldError = 'ER_BAD_FIELD_ERROR';

/**
 * Error code when the table doesn't exist in database;
 */
export const TableNotExist = 'ER_NO_SUCH_TABLE';

/**
 * Error code when too many connection is made.
 */
export const ConnectionCountError = 'ER_CON_COUNT_ERROR';

/**
 * Error code for duplicate entry.
 */
export const DuplicateEntry = 'ER_DUP_ENTRY';

/**
 * Error code when sql statement doesn't follow sql statement syntax of database.
 */
export const ParseError = 'ER_PARSE_ERROR';