exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    },
    body: JSON.stringify({
      success: true,
      message: 'Test function is working!',
      timestamp: new Date().toISOString(),
      event: {
        path: event.path,
        method: event.httpMethod
      }
    })
  };
}; 