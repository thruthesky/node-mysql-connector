/**
 * Error code regarding connection.
 *
 * @occur
 * * When wrong port.
 */
export const ConnectionRefused = 'ECONNREFUSED';

/**
 * Error code regarding connection.
 *
 * @occur
 * * When the connection limit reached.
 */
export const ConnectionCountError = 'ER_CON_COUNT_ERROR';

/**
 * Error code regarding accessing database.
 *
 * @occur
 * * Wrong password.
 */
export const AccessDenied = 'ER_ACCESS_DENIED_ERROR';

/**
 * Error code regarding field.
 *
 * @occur
 * * value supplied is incompatible type.
 */
export const FieldWrongValue = 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD'

/**
 * Error code regarding field.
 *
 * @occur
 * * When the field can't be null.
 */
export const FieldNoDefault = 'ER_NO_DEFAULT_FOR_FIELD';

/**
 * Error code regarding field.
 *
 * @occur
 * * When the field doesn't exist in table.
 */
export const FieldError = 'ER_BAD_FIELD_ERROR';

/**
 * Error code regarding field.
 *
 * @occur
 * * giving null value when field can't be null.
 */
export const NullError = 'ER_BAD_NULL_ERROR';

/**
 * Error code regarding field.
 *
 * @occur
 * * When the record must be unique.
 */
export const DuplicateEntry = 'ER_DUP_ENTRY';

/**
 * Error code regarding table.
 *
 * @occur
 * * When selecting table that never exists in database.
 */
export const TableNotExist = 'ER_NO_SUCH_TABLE';

/**
 * Error code regarding table.
 *
 * @occur
 * * Droping table that doesn't exist.
 */
export const TableError = 'ER_BAD_TABLE_ERROR';

/**
 * Error code regaring SQL statement.
 *
 * @occur
 * * When SQL statement has inccorect syntax.
 */
export const ParseError = 'ER_PARSE_ERROR';

/**
 * Error code regarding SQL statement.
 *
 * @occur
 * * When supplying NaN value on LIMIT clause.
 */
export const SpUndeclaredVar = 'ER_SP_UNDECLARED_VAR';

/**
 * Custom error code regarding connection.
 * 
 * @occur
 * * When trying to use node connector before establishing database connection.
 */
export const NoDBConnection = {code: 'NO_DB_CONNECTION_CREATED', message: 'No established database connection'};