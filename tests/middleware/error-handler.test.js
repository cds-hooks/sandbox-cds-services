const errorHandler = require('../../middleware/error-handler');

describe('Error Handler', () => {

  let res;
  beforeEach(() => {
    res = {
      data: null,
      code: null,
      status (status) {
        this.code = status;
        return this;
      },
      set: (data) => {
        return null;
      },
      send (payload) {
        this.data = payload;
      }
    };
  });

  test('returns a 404 if an error with that status has been passed in', () => {
    const err = {
      status: 404,
      message: 'Not Found'
    };
    errorHandler(err, null, res, null);

    expect(res.code).toBe(404);
    expect(res.data).toBe('Not Found');
  });

  test('returns a 500 if no error status has been specified', () => {
    errorHandler(new Error(), null, res, null);

    expect(res.code).toBe(500);
    expect(res.data).toBe('Internal Server Error');
  });
});
