export const pipelineTypes = {
  generate: {
    label: 'Generate',
    subtypes: [
      { value: 'tables', label: 'Tables' },
      { value: 'views', label: 'Views' }
    ]
  },
  compare: {
    label: 'Compare',
    subtypes: [
      { value: 'tables', label: 'Tables' },
      { value: 'views', label: 'Views' },
      { value: 'seed data', label: 'Seed Data' }
    ]
  }
};
