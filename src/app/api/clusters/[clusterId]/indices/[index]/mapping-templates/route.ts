import { NextRequest } from "next/server"
import { handleApiRoute } from "@/lib/utils/api-utils"

const COMMON_TEMPLATES = {
  text: {
    type: 'text',
    analyzer: 'standard',
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256
      }
    }
  },
  keyword: {
    type: 'keyword',
    ignore_above: 256
  },
  date: {
    type: 'date',
    format: 'strict_date_optional_time||epoch_millis'
  },
  long: {
    type: 'long'
  },
  integer: {
    type: 'integer'
  },
  double: {
    type: 'double'
  },
  boolean: {
    type: 'boolean'
  },
  object: {
    type: 'object',
    dynamic: true
  },
  nested: {
    type: 'nested'
  },
  ip: {
    type: 'ip'
  },
  geo_point: {
    type: 'geo_point'
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ clusterId: string; index: string }> }
) {
  const params = await props.params;
  return handleApiRoute(async () => {
    return {
      success: true,
      data: COMMON_TEMPLATES
    }
  })
} 