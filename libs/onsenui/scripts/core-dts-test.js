////////////////////////////////////////
// core-dts-test
////////////////////////////////////////

const fs = require('fs');
const childProcess = require('child_process');

const docsBuilder = require('../docs/wcdoc');

// Usage:
//     # validate the d.ts file for the core
//     gulp core-dts-test


// ons-foo-bar -> onsFooBar
const camelize = (string) => {
  return string.toLowerCase().replace(/-([a-z])/g, function (m, l) {
    return l.toUpperCase();
  });
};

/**
 * Create a test function written in TypeScript based on an element definition.
 */
const createTestFunctionForElement = (elementName, properties, methods) => {
  let code = '';
  code += `// Test for <${elementName}>\n`;
  code += `function ${camelize('test-' + elementName)}Element(): void {\n`;
  if (properties.length === 0 && methods.length === 0) {
    code += `  // This element has no members.\n`;
  } else {
    code += `  const ${camelize(elementName)} = <${camelize('-' + elementName)}Element>document.querySelector('${elementName}');\n`;
    for (const property of properties) {
      code += `  ${camelize(elementName)}.${property.name};\n`;
    }
    for (const method of methods) {
      code += `  ${camelize(elementName)}.${method.name};\n`;
    }
  }
  code += `}\n`;

  return code;
}

/**
 * Create a test function written in TypeScript based on an object definition.
 */
const createTestFunctionForObject = (objectName, properties, methods) => {
  let code = '';
  code += `// Test for ${objectName}\n`;
  code += `function test${camelize('-' + objectName.replace('.', '-'))}Object(): void {\n`;
  for (const property of properties) {
    if (property.name.includes('|')) { // Prevent `ons.GestureDetector.EVENT_START|MOVE|END|RELEASE|TOUCH;`
      for (const splittedProperty of property.name.split('|')) {
        code += `  ${objectName}.${splittedProperty};\n`;
      }
    } else {
        code += `  ${objectName}.${property.name};\n`;
    }
  }
  for (const method of methods) {
    code += `  ${objectName}.${method.name};\n`;
  }
  code += `}\n`;

  return code;
}

/**
 * Create a TypeScript code which tests the d.ts file for the core
 */
const createTestScript = (elementDefinitions, objectDefinitions) => {
  let code = '';
  code += `import * as ons from './onsenui';\n`;
  code += `import {\n`;
  for (const el of Object.values(elementDefinitions)) {
    // ignore elements which have no members
    if (el.properties.length === 0 && el.methods.length === 0) {
      continue;
    }

    code += `  ${camelize('-' + el.name)}Element,\n`;
  }
  code += `} from './onsenui';\n`;
  code += `\n`;
  code += `// Caution: This file is automatically generated by gulpfile. Please do not edit this.\n`;
  code += `\n`;
  for (const el of Object.values(elementDefinitions)) {
    code += createTestFunctionForElement(el.name, el.properties, el.methods);
    code += `\n`;
  }
  for (const obj of Object.values(objectDefinitions)) {
    switch (true) { // regex switch
      case /^ons$/.test(obj.name):
        code += createTestFunctionForObject(obj.name, obj.properties, obj.methods);
        break;
      default:
        code += createTestFunctionForObject(obj.name, obj.properties, obj.methods);
        break;
    }
    code += `\n`;
  }

  return code;
}

docsBuilder.collect({ // Retrive metadata of core elements and objects via `wcdoc`
  src: [
    './esm/elements/**/*.js',
    './esm/ons/**/*.js',
    '!**/*.spec.js'
  ]
}).then(function(result) {
  // Generate test script based on metadata of the core
  const testScript = createTestScript(result.element, result.object);

  // Write generated script to a file
  fs.writeFileSync('esm/core-dts-test.ts', testScript, {encoding: 'utf8'});

  // Test the d.ts file with the generated script
  // --types flag with no value stops @types files from node_modules from being used
  childProcess.spawn('npx', ['tsc', 'esm/core-dts-test.ts', '--types', '--target', 'es6'],
    {stdio: 'inherit'} // redirect stdio/stdout/stderr to this process
  )
  .on('error', function (error) {
      throw new Error(error.message);
  })
  .on('exit', function(code) {
    if (code !== 0) {
      throw new Error('tsc exited with code ' + code);
    } else {
      return;
    }
  });
}).catch(function(reason) {
  console.log(reason);
  console.log(reason.stack);
  throw reason;
});
