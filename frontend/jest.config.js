module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleDirectories: ['node_modules', 'src'],
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
 
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};


