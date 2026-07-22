export const formatMetaDataRequest = (
  action: string,
  data: any,
): Record<string, unknown> | undefined => {
  let metadata: Record<string, unknown> | undefined;
  if (action === "LOGIN_FAILED") {
    metadata = { attemptedIdentity: data.email };
  } else if (["CREATE", "UPDATE", "DELETE"].includes(action)) {
    metadata = { requestedChanges: data };
  }
  return metadata;
};
