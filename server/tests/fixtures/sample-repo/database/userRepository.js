/**
 * User data repository
 */
export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findUserById(userId) {
    // Security flaw: dynamic query concatenation with raw untrusted variable
    const query = 'SELECT * FROM users WHERE id = \'' + userId + '\'';
    return await this.db.query(query);
  }
}
