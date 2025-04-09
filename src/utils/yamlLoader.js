import yaml from 'js-yaml';

export async function loadYamlData(path) {
  try {
    // Import the YAML file directly using Vite's import.meta.url
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const yamlText = await response.text();
    const data = yaml.load(yamlText);
    return data;
  } catch (error) {
    console.error('Error loading YAML:', error);
    throw error;
  }
}