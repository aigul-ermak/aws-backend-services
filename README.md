Task 4.1:
- Tables were created. Scirpt to fill data to tables were created and executed. 
![image](https://github.com/user-attachments/assets/5f5578a3-b0c7-4df9-862c-e48282dff520)
![image](https://github.com/user-attachments/assets/5b7ac1a4-6f58-41cd-9aff-0c4f5f4712fd)

Task 4.2
- AWS CDK is refactored for get data form dynomoDB tables.
- FE was refactored to display products -> 
https://d1lsm5asjne446.cloudfront.net/
https://d1lsm5asjne446.cloudfront.net/admin/products
https://d1lsm5asjne446.cloudfront.net/admin/product-form/1afd5a12-4481-46e8-9f4f-2270df32f444
![image](https://github.com/user-attachments/assets/754be1b9-32f7-4e63-bfce-52715c8e043e)
![image](https://github.com/user-attachments/assets/f73bec1e-301c-42f7-a1b3-0c28e30d3f63)

Task 4.3
- Create product funtionality was implemented. 
- POST request - > https://naabdgciyh.execute-api.us-east-1.amazonaws.com/prod/products/
Before creating product : 
![image](https://github.com/user-attachments/assets/5682fc8c-336e-42b7-bfb1-f2d1248190a1)
After:
![image](https://github.com/user-attachments/assets/c442c5f4-0cfd-4369-8943-d9d6885ea117)
![image](https://github.com/user-attachments/assets/8acd68da-11c2-43be-882f-3158ac174793)

Task 4.4
Branch was created.

Additional Tasks:
POST /products lambda added error 400 status code if product data is invalid.
![image](https://github.com/user-attachments/assets/2a4c8cd8-5d15-40a5-96be-6b14e0910582)

All lambdas return error 500 status code on any error (DB connection, any unhandled error in code).
All lambdas do console.log for each incoming requests and their arguments.
![image](https://github.com/user-attachments/assets/04eab9e1-699c-4ce8-8917-6729a87202fb)
![image](https://github.com/user-attachments/assets/5732975f-2aee-4ab2-b658-64b649acb803)
![image](https://github.com/user-attachments/assets/71f7c04e-d6ba-450e-b7aa-d9744c3227d1)

Transaction was added.
![image](https://github.com/user-attachments/assets/cc41906a-62c4-4277-a737-0ddf65d92b78)
