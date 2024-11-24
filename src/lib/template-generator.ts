"use client"

import { OpenSearchClient } from "./opensearch"
import {
  getRandomWord,
  getRandomWords,
  getRandomInt,
  getRandomFloat,
  getRandomBoolean,
  getRandomDate,
  getRandomEmail,
  getRandomIP,
  getRandomName,
  getRandomURL,
  getRandomVersion,
  getRandomStatus,
  getRandomTags
} from "./utils/random-utils"

interface FieldMapping {
  type: string;
  properties?: Record<string, FieldMapping>;
  fields?: Record<string, { type: string }>;
}

interface IndexMapping {
  mappings: {
    properties: Record<string, FieldMapping>;
  };
}

function getDefaultValueForType(type: string, fieldName: string = ""): any {
  // 智能字段识别 - 根据字段名推断类型
  const nameLower = fieldName.toLowerCase()
  
  // 常见字段名匹配
  if (nameLower.includes("email") || nameLower.endsWith("mail")) {
    return getRandomEmail()
  }
  if (nameLower.includes("name") || nameLower.endsWith("name") || nameLower.includes("author")) {
    return getRandomName()
  }
  if (nameLower.includes("ip") || nameLower.endsWith("ip")) {
    return getRandomIP()
  }
  if (nameLower.includes("url") || nameLower.includes("link") || nameLower.includes("website")) {
    return getRandomURL()
  }
  if (nameLower.includes("version") || nameLower.endsWith("ver")) {
    return getRandomVersion()
  }
  if (nameLower.includes("status") || nameLower.includes("state")) {
    return getRandomStatus()
  }
  if (nameLower.includes("tags") || nameLower.includes("labels") || nameLower.includes("categories")) {
    return getRandomTags()
  }
  if (nameLower.includes("description") || nameLower.includes("desc") || 
      nameLower.includes("content") || nameLower.includes("text") || 
      nameLower.includes("summary") || nameLower.includes("comment")) {
    return getRandomWords(5)
  }
  if (nameLower.includes("created") || nameLower.includes("updated") || 
      nameLower.includes("timestamp") || nameLower.includes("date") || 
      nameLower.includes("time")) {
    return getRandomDate()
  }
  if (nameLower.includes("enabled") || nameLower.includes("active") || 
      nameLower.includes("visible") || nameLower.includes("deleted") ||
      nameLower.includes("flag")) {
    return getRandomBoolean()
  }
  if (nameLower.includes("count") || nameLower.includes("number") || 
      nameLower.includes("qty") || nameLower.includes("amount")) {
    return getRandomInt(0, 1000)
  }
  if (nameLower.includes("price") || nameLower.includes("cost") || 
      nameLower.includes("rate") || nameLower.includes("percentage")) {
    return getRandomFloat(0, 1000)
  }

  // 根据OpenSearch字段类型生成随机值
  switch (type) {
    case 'text':
    case 'keyword':
      return getRandomWord()
    case 'long':
      return getRandomInt(-1000000, 1000000)
    case 'integer':
      return getRandomInt(-1000, 1000)
    case 'short':
      return getRandomInt(-100, 100)
    case 'byte':
      return getRandomInt(-128, 127)
    case 'double':
    case 'float':
      return getRandomFloat(-1000, 1000)
    case 'half_float':
    case 'scaled_float':
      return getRandomFloat(-100, 100)
    case 'boolean':
      return getRandomBoolean()
    case 'date':
      return getRandomDate()
    case 'object':
      return {}
    case 'nested':
      return []
    case 'ip':
      return getRandomIP()
    case 'binary':
      return 'base64_encoded_data'
    case 'array':
      return []
    default:
      return null
  }
}

function generateTemplateFromMapping(mapping: FieldMapping, path: string[] = []): any {
  if (mapping.type === 'nested') {
    return [generateTemplateFromMapping({ ...mapping, type: 'object' }, path)];
  }

  if (mapping.properties) {
    const template: Record<string, any> = {};
    for (const [key, value] of Object.entries(mapping.properties)) {
      template[key] = generateTemplateFromMapping(value, [...path, key]);
    }
    return template;
  }

  // 处理多字段类型
  if (mapping.fields) {
    return getDefaultValueForType(mapping.type, path[path.length - 1]);
  }

  return getDefaultValueForType(mapping.type, path[path.length - 1]);
}

export async function generateDocumentTemplate(client: OpenSearchClient, index: string): Promise<string> {
  try {
    const response = await client.executeQuery({
      method: 'GET',
      path: `/${index}/_mapping`
    });

    if (!response || !response.success) {
      throw new Error(`No response received for index ${index}`);
    }

    console.log('Mapping response:', response)

    if (!response.data || !response.data[index]) {
      throw new Error(`Index ${index} not found`);
    }

    const mapping = response.data[index] as IndexMapping;
    if (!mapping?.mappings?.properties) {
      throw new Error(`No mapping properties found for index ${index}`);
    }

    const template = generateTemplateFromMapping({ 
      type: 'object', 
      properties: mapping.mappings.properties 
    });

    return JSON.stringify(template, null, 2);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate template: ${error.message}`);
    }
    throw error;
  }
}

export async function generateBulkTemplate(client: OpenSearchClient, index: string, count: number = 2): Promise<string> {
  try {
    const singleTemplate = await generateDocumentTemplate(client, index);
    const singleObject = JSON.parse(singleTemplate);
    
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      // Add metadata line
      lines.push(JSON.stringify({ index: { _index: index } }) + '\n');
      
      // Add data line with modified values to make each document unique
      const modifiedObject = JSON.parse(JSON.stringify(singleObject));
      Object.keys(modifiedObject).forEach(key => {
        const value = modifiedObject[key]
        if (Array.isArray(value)) {
          // 如果是数组，生成新的随机数组
          modifiedObject[key] = getRandomTags()
        } else if (typeof value === 'string') {
          if (value.includes('@')) {
            modifiedObject[key] = getRandomEmail()
          } else if (value.includes('http')) {
            modifiedObject[key] = getRandomURL()
          } else if (value.includes('.')) {
            modifiedObject[key] = getRandomIP()
          } else {
            modifiedObject[key] = getRandomWords()
          }
        } else if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            modifiedObject[key] = getRandomInt(-1000, 1000)
          } else {
            modifiedObject[key] = getRandomFloat(-1000, 1000)
          }
        } else if (typeof value === 'boolean') {
          modifiedObject[key] = getRandomBoolean()
        }
      });
      lines.push(JSON.stringify(modifiedObject) + '\n');
    }
    
    return lines.join('');
  } catch (error) {
    console.error('Error generating bulk template:', error);
    throw error;
  }
}
