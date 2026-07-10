{{/* 統一命名：資源名以 release 名為前綴（chart 名固定 solkidgalgame，family 部署一般 release=luminara）。 */}}
{{- define "solkidgal.name" -}}
{{ .Release.Name }}
{{- end }}

{{- define "solkidgal.labels" -}}
app.kubernetes.io/name: solkidgalgame
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* image tag：values 留空＝隨 chart appVersion（版本鏈同源，cfgTest#12）。 */}}
{{- define "solkidgal.imageTag" -}}
{{ .Values.image.tag | default .Chart.AppVersion }}
{{- end }}

{{/*
秘密生命週期（design ＜II.A (D)＞ paramSecrets）：
- values 有值 → 用 values（安裝時以 -f secrets.yaml 供給）。
- values 留空且叢集已有本 release 之 Secret → lookup 沿用既值（upgrade 不重供即沿用、不重抽）。
- 兩者皆無 → adminUsername/adminPassword 必填即報錯；sessionSecret/postgresPassword 首次自動生成。
*/}}
{{- define "solkidgal.secretValue" -}}
{{- $ctx := index . 0 -}}
{{- $key := index . 1 -}}
{{- $required := index . 2 -}}
{{- $fromValues := index $ctx.Values.secrets $key -}}
{{- if $fromValues -}}
{{- $fromValues -}}
{{- else -}}
{{- $existing := lookup "v1" "Secret" $ctx.Release.Namespace (printf "%s-secrets" $ctx.Release.Name) -}}
{{- if and $existing (hasKey $existing.data $key) -}}
{{- index $existing.data $key | b64dec -}}
{{- else if $required -}}
{{- fail (printf "secrets.%s 為必填：首次安裝請以 -f secrets.yaml 供給（見 README 部署節；chart 不設不安全預設值）" $key) -}}
{{- else -}}
{{- randAlphaNum 32 -}}
{{- end -}}
{{- end -}}
{{- end }}
