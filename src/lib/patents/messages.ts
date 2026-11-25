export const MISSING_API_KEY_MESSAGE =
  "检索美国专利需要免费的 PatentsView API 密钥。请配置环境变量 PATENTSVIEW_API_KEY 后再试。申请步骤见使用说明，不需要付费。";

export const REJECTED_API_KEY_MESSAGE =
  "PatentsView 拒绝了当前密钥。请确认 PATENTSVIEW_API_KEY 仍然有效，且没有多余空格。";

export const RATE_LIMIT_MESSAGE =
  "PatentsView 限制了请求频率（每把免费密钥大约每分钟 45 次）。请稍后再试。相同检索会写入服务器缓存，重复查看不会再次请求上游。";

export const UPSTREAM_UNREACHABLE_MESSAGE =
  "暂时无法连接 PatentsView。请检查网络后重试。";

export const UPSTREAM_ERROR_MESSAGE = "PatentsView 返回了错误响应，检索没有完成。";

export const EPO_NOT_IMPLEMENTED_MESSAGE =
  "EPO OPS 适配器尚未实现在线调用。全球书目、同族和 INPADOC 法律状态需要以后按 README「后续接入 EPO OPS」接上，当前不会访问 EPO。";

export const EMPTY_QUERY_MESSAGE = "请至少填写一个检索条件。";

export const NUMBER_TOO_SHORT_MESSAGE = "专利号或公开号过短，请检查后重试。";

export const NUMBER_FORMAT_MESSAGE =
  "专利号格式无法识别。可输入美国授权号（如 6285999）或公开号（如 US20200123456A1）。";

export const CLASSIFICATION_FORMAT_MESSAGE =
  "分类号格式无法识别。请输入 IPC 或 CPC，例如 H01M 或 G06F16/00。";

export const FIELD_TOO_LONG_MESSAGE = "检索词过长，请缩短后再试。";
