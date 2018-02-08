import { resolve } from 'path';

import { absolutePathSnaphotSerializer } from '../test_helpers';
import { linkProjectExecutables } from './link_project_executables';
import { Project } from './project';

const projectsByName = new Map([
  [
    'foo',
    new Project(
      {
        name: 'foo',
        dependencies: {
          bar: 'link:../bar',
        },
      },
      resolve(__dirname, 'foo')
    ),
  ],
  [
    'bar',
    new Project(
      {
        name: 'bar',
        bin: 'bin/bar.js',
      },
      resolve(__dirname, 'bar')
    ),
  ],
]);

const projectGraph = new Map([
  ['foo', [projectsByName.get('bar')]],
  ['bar', []],
]);

function getFsMockCalls() {
  const fs = require('./fs');
  const fsMockCalls = {};
  Object.keys(fs).map(key => {
    if (jest.isMockFunction(fs[key])) {
      fsMockCalls[key] = fs[key].mock.calls;
    }
  });
  return fsMockCalls;
}

expect.addSnapshotSerializer(absolutePathSnaphotSerializer);
jest.mock('./fs');
afterEach(() => {
  jest.resetAllMocks();
});

describe('bin script points nowhere', () => {
  test('does not try to create symlink or node_modules/.bin directory', async () => {
    const fs = require('./fs');
    fs.isFile.mockReturnValue(false);

    await linkProjectExecutables(projectsByName, projectGraph);
    expect(getFsMockCalls()).toMatchSnapshot('fs module calls');
  });
});

describe('bin script points to a file', () => {
  test('creates a symlink in the project node_modules/.bin directory', async () => {
    const fs = require('./fs');
    fs.isFile.mockReturnValue(true);

    await linkProjectExecutables(projectsByName, projectGraph);
    expect(getFsMockCalls()).toMatchSnapshot('fs module calls');
  });
});