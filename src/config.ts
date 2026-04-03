// After deploying infrastructure/template.yaml, replace this with the ApiUrl
// output from CloudFormation. Run: aws cloudformation describe-stacks
// --stack-name adndkr-tracker --query "Stacks[0].Outputs"
export const API_BASE_URL: string = 'https://yp8e0vcgj9.execute-api.eu-central-1.amazonaws.com';
