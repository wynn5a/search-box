// 错误消息映射
export const ERROR_MESSAGES: Record<string, string> = {
  // 索引相关
  'resource_already_exists_exception': '索引已存在，如果要重新创建，请先删除现有索引',
  'index_not_found_exception': '索引不存在，请检查索引名称是否正确',
  'invalid_index_name_exception': '索引名称无效，不能包含特殊字符',
  
  // 查询相关
  'parsing_exception': '查询语法错误，请检查查询语句格式',
  'search_phase_execution_exception': '搜索执行错误，可能是查询语句有误',
  'query_shard_exception': '查询分片出错，请检查查询条件',
  
  // 字段相关
  'mapper_parsing_exception': '字段映射解析错误，请检查字段定义',
  'illegal_argument_exception': '参数错误，请检查请求参数',
  
  // 集群相关
  'cluster_block_exception': '集群当前被阻止执行此操作',
  'no_shard_available_action_exception': '没有可用的分片，集群可能存在问题',
  
  // 通用错误
  'validation_exception': '验证失败，请检查请求内容',
  'action_request_validation_exception': '请求验证失败，请检查必填参数',
  
  // 权限相关
  'security_exception': '没有执行此操作的权限，请检查用户权限',
  'authorization_exception': '授权失败，请检查访问权限',
  
  // 其他常见错误
  'version_conflict_engine_exception': '版本冲突，数据可能已被其他操作修改',
  'document_missing_exception': '文档不存在',
  'circuit_breaking_exception': '内存使用超出限制，请优化查询'
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
export function getFriendlyErrorMessage(error: any): string {
  const errorType = extractErrorType(error)
  const errorReason = getErrorReason(error)
  const defaultMessage = '执行查询时发生错误，请检查请求内容'
  
  if (!errorType) {
    return errorReason || defaultMessage
  }

  // 对特定错误类型提供更详细的说明
  const errorMessage = ERROR_MESSAGES[errorType]
  if (errorMessage) {
    // 如果有具体的索引名称，添加到错误消息中
    if (errorReason && errorType === 'resource_already_exists_exception') {
      const indexMatch = errorReason.match(/index \[(.*?)\]/)
      const indexName = indexMatch ? indexMatch[1].split('/')[0] : ''
      if (indexName) {
        return `索引 "${indexName}" 已存在，如果要重新创建，请先删除现有索引`
      }
    }
    return errorMessage
  }

  return errorReason || defaultMessage
}
