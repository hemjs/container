import { Container } from '../src/';

function createContainer(): Container {
  return new Container();
}

describe('Container', () => {
  it('should return an instance of Container', () => {
    expect(createContainer()).toBeInstanceOf(Container);
  });
});
