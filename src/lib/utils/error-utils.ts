// 错误消息映射
// 错误消息映射
export const ERROR_MESSAGES: Record<string, { en: string; zh: string }> = {
  // 索引相关
  'resource_already_exists_exception': {
    en: 'Index already exists. To recreate, please delete the existing index first.',
    zh: '索引已存在，如果要重新创建，请先删除现有索引'
  },
  'index_not_found_exception': {
    en: 'Index not found. Please check if the index name is correct.',
    zh: '索引不存在，请检查索引名称是否正确'
  },
  'invalid_index_name_exception': {
    en: 'Invalid index name. It cannot contain special characters.',
    zh: '索引名称无效，不能包含特殊字符'
  },

  // 查询相关
  'parsing_exception': {
    en: 'Query syntax error. Please check the query format.',
    zh: '查询语法错误，请检查查询语句格式'
  },
  'search_phase_execution_exception': {
    en: 'Search execution error. The query might be incorrect.',
    zh: '搜索执行错误，可能是查询语句有误'
  },
  'query_shard_exception': {
    en: 'Query shard error. Please check query conditions.',
    zh: '查询分片出错，请检查查询条件'
  },

  // 字段相关
  'mapper_parsing_exception': {
    en: 'Field mapping parse error. Please check field definitions.',
    zh: '字段映射解析错误，请检查字段定义'
  },
  'illegal_argument_exception': {
    en: 'Invalid argument. Please check request parameters.',
    zh: '参数错误，请检查请求参数'
  },

  // 集群相关
  'cluster_block_exception': {
    en: 'Cluster is currently blocked from executing this operation.',
    zh: '集群当前被阻止执行此操作'
  },
  'no_shard_available_action_exception': {
    en: 'No shards available. The cluster might have issues.',
    zh: '没有可用的分片，集群可能存在问题'
  },

  // 通用错误
  'validation_exception': {
    en: 'Validation failed. Please check request content.',
    zh: '验证失败，请检查请求内容'
  },
  'action_request_validation_exception': {
    en: 'Request validation failed. Please check required parameters.',
    zh: '请求验证失败，请检查必填参数'
  },

  // 权限相关
  'security_exception': {
    en: 'Permission denied. Please check user permissions.',
    zh: '没有执行此操作的权限，请检查用户权限'
  },
  'authorization_exception': {
    en: 'Authorization failed. Please check access permissions.',
    zh: '授权失败，请检查访问权限'
  },

  // 其他常见错误
  'version_conflict_engine_exception': {
    en: 'Version conflict. Data might have been modified by other operations.',
    zh: '版本冲突，数据可能已被其他操作修改'
  },
  'document_missing_exception': {
    en: 'Document not found.',
    zh: '文档不存在'
  },
  'circuit_breaking_exception': {
    en: 'Memory usage exceeded limit. Please optimize your query.',
    zh: '内存使用超出限制，请优化查询'
  }
}

// 提取错误类型
export function extractErrorType(error: any): string {
  // 处理 OpenSearch ResponseError
  if (error?.details?.meta?.body?.error?.type) {
    return error.details.meta.body.error.type
  }

  // 处理标准错误对象
  if (error?.type) {
    return error.type
  }

  // 处理嵌套的错误对象
  if (error?.reason?.type) {
    return error.reason.type
  }

  return ''
}

// 获取错误的详细原因
export function getErrorReason(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  // 处理 OpenSearch ResponseError
  if (error?.details?.meta?.body?.error?.reason) {
    return error.details.meta.body.error.reason
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.message) {
    return error.message
  }

  return ''
}

// 获取友好的错误消息
export function getFriendlyErrorMessage(error: any, locale: string = 'zh'): string {
  const errorType = extractErrorType(error)
  const errorReason = getErrorReason(error)
  const defaultMessage = locale === 'zh'
    ? '执行查询时发生错误，请检查请求内容'
    : 'An error occurred while executing the query. Please check the request content.'

  if (!errorType) {
    return errorReason || defaultMessage
  }

  // 对特定错误类型提供更详细的说明
  const errorMessage = ERROR_MESSAGES[errorType]
  if (errorMessage) {
    const message = locale === 'zh' ? errorMessage.zh : errorMessage.en

    // 如果有具体的索引名称，添加到错误消息中
    if (errorReason && errorType === 'resource_already_exists_exception') {
      const indexMatch = errorReason.match(/index \[(.*?)\]/)
      const indexName = indexMatch ? indexMatch[1].split('/')[0] : ''
      if (indexName) {
        return locale === 'zh'
          ? `索引 "${indexName}" 已存在，如果要重新创建，请先删除现有索引`
          : `Index "${indexName}" already exists. To recreate, please delete the existing index first.`
      }
    }
    return message
  }

  return errorReason || defaultMessage
}
