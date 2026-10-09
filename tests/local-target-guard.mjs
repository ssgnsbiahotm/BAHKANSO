export const LOCAL_PROJECT_ID = 'bahkanso-isolated-access-test';
export const LOCAL_API_URL = 'http://127.0.0.1:56321';
export const LOCAL_DB_HOST = '127.0.0.1';
export const LOCAL_DB_PORT = '56322';

const linkedFields = [
  'linked_project_ref',
  'linked_project_name',
  'linked_org_slug',
  'linked_org_id',
  'linked_branch',
  'linked_parent_project_ref',
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesLocalDatabaseUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.hostname === LOCAL_DB_HOST &&
      url.port === LOCAL_DB_PORT &&
      url.pathname === '/postgres' &&
      url.search === '' &&
      url.hash === ''
    );
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

function linkedProjectDiagnostic(status) {
  const present = isRecord(status) && Object.hasOwn(status, 'linked_project');
  const value = present ? status.linked_project : undefined;
  return {
    present,
    type: !present
      ? 'absent'
      : value === null
        ? 'null'
        : Array.isArray(value)
          ? 'array'
          : typeof value,
    isNull: present && value === null,
    isNonNull: present && value !== null,
  };
}

export function checkLocalTarget(statusOutput, evidence, outputMode = 'status-values-json') {
  let status;
  let statusJsonValid = false;
  try {
    status = JSON.parse(statusOutput);
    statusJsonValid = true;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  const statusShapeValid = isRecord(status);
  const linkedProject = linkedProjectDiagnostic(status);
  const linkedIndicatorsPresent = statusShapeValid
    ? linkedFields.filter(field => Object.hasOwn(status, field))
    : [];
  const noLinkedIndicators = linkedIndicatorsPresent.length === 0;
  const noRemoteLink = outputMode === 'status-values-json'
    ? !linkedProject.present && noLinkedIndicators
    : outputMode === 'structured-json'
      ? linkedProject.present && linkedProject.isNull && noLinkedIndicators
      : false;
  const apiUrlMatchesLocal = statusShapeValid && status.API_URL === LOCAL_API_URL;
  const dbUrlMatchesLocal = statusShapeValid && matchesLocalDatabaseUrl(status.DB_URL);

  const diagnostic = {
    statusJsonValid,
    statusShapeValid,
    outputMode,
    linkedProject,
    linkedIndicatorsPresent,
    apiUrlMatchesLocal,
    dbUrlMatchesLocal,
    linkProjectIdEnvironmentPresent: evidence.linkProjectIdEnvironmentPresent,
    workdirEnvironmentPresent: evidence.workdirEnvironmentPresent,
    projectRefFilePresent: evidence.projectRefFilePresent,
    linkedProjectCacheFilePresent: evidence.linkedProjectCacheFilePresent,
    localProjectIdMatches: evidence.localProjectId === LOCAL_PROJECT_ID,
  };

  const allowed =
    statusJsonValid &&
    statusShapeValid &&
    noRemoteLink &&
    apiUrlMatchesLocal &&
    dbUrlMatchesLocal &&
    !evidence.linkProjectIdEnvironmentPresent &&
    !evidence.workdirEnvironmentPresent &&
    !evidence.projectRefFilePresent &&
    !evidence.linkedProjectCacheFilePresent &&
    evidence.localProjectId === LOCAL_PROJECT_ID;

  return { allowed, diagnostic };
}
