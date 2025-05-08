



// // src/app/s3-upload.service.ts
// import { Injectable } from '@angular/core';
// import axios from 'axios';

// @Injectable({
//   providedIn: 'root',
// })
// export class S3UploadService {
//   constructor() {}

//   async uploadFile(file: File, onProgress: (percent: number) => void): Promise<any> {
//     try {
//       const partSize = 10 * 1024 * 1024; // 10MB
//       const totalParts = Math.ceil(file.size / partSize);

//       // 1. Initiate multipart upload
//       const initRes: any = await axios.post('http://localhost:3000/api/v1/s3/initiate-multipart-upload', {
//         filename: file.name,
//         fileType: file.type,
//         parts: totalParts,
//       });

//       const { uploadId, key, presignedUrls } = initRes.data.body;

//       console.log(
//         `totalParts: ${totalParts} ..... uploadId: ${uploadId} ..... key: ${key}`
//       );

//       const parts: { ETag: string; PartNumber: number }[] = [];
//       const partProgresses = new Array(totalParts).fill(0); // Per-part progress

//       const uploadPartWithProgress = (url: string, blob: Blob, partIndex: number): Promise<void> => {
//         return new Promise((resolve, reject) => {
//           const xhr = new XMLHttpRequest();
//           xhr.open('PUT', url);
//           xhr.setRequestHeader('Content-Type', file.type);

//           xhr.upload.onprogress = (event) => {
//             if (event.lengthComputable) {
//               partProgresses[partIndex] = event.loaded / event.total;
//               const totalProgress = partProgresses.reduce((sum, val) => sum + val, 0) / totalParts;
//               onProgress(Math.round(totalProgress * 100));
//             }
//           };

//           xhr.onload = () => {
//             const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
//             if (etag) {
//               parts.push({
//                 ETag: etag,
//                 PartNumber: partIndex + 1,
//               });
//               resolve();
//             } else {
//               reject(new Error('ETag missing from response'));
//             }
//           };

//           xhr.onerror = () => reject(new Error('Upload failed'));
//           xhr.send(blob);
//         });
//       };

//       // 2. Upload parts in parallel
//       const uploadPromises = presignedUrls.map((url: string, index: number) => {
//         const start = index * partSize;
//         const end = Math.min(start + partSize, file.size);
//         const blob = file.slice(start, end);
//         return uploadPartWithProgress(url, blob, index);
//       });

//       await Promise.all(uploadPromises);

//       // 3. Complete multipart upload
//       const completeRes: any = await axios.post('http://localhost:3000/api/v1/s3/complete-multipart-upload', {
//         uploadId,
//         key,
//         parts,
//       });

//       return completeRes.data.body;
//     } catch (err) {
//       console.error('Upload failed:', err);
//       throw err;
//     }
//   }
// }






import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class S3UploadService {
  constructor() {}

  async uploadFile(file: File, onProgress: (percent: number) => void): Promise<any> {
    try {
      const partSize = 10 * 1024 * 1024; // 10MB
      const totalParts = Math.ceil(file.size / partSize);

      // 1. Initiate multipart upload
      const initRes: any = await axios.post('http://localhost:3000/api/v1/s3/initiate-multipart-upload', {
        filename: file.name,
        fileType: file.type,
        partCount: totalParts,
      });

      const { uploadId, key, presignedUrls } = initRes.data.body;

      console.log(`totalParts: ${totalParts} ..... uploadId: ${uploadId} ..... key: ${key}`);

      const parts: { ETag: string; PartNumber: number }[] = [];
      const partProgresses = new Array(totalParts).fill(0); // Per-part progress

      const uploadPartWithProgress = (url: string, blob: Blob, partIndex: number): Promise<void> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              partProgresses[partIndex] = event.loaded / event.total;
              const totalProgress = partProgresses.reduce((sum, val) => sum + val, 0) / totalParts;
              onProgress(Math.round(totalProgress * 100));
            }
          };

          xhr.onload = () => {
            const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
            if (etag) {
              parts.push({
                ETag: etag,
                PartNumber: partIndex + 1,
              });
              resolve();
            } else {
              reject(new Error('ETag missing from response'));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(blob);
        });
      };

      // 2. Upload parts in parallel
      const uploadPromises = presignedUrls.map((url: string, index: number) => {
        const start = index * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        return uploadPartWithProgress(url, blob, index);
      });

      await Promise.all(uploadPromises);

      // 3. Complete multipart upload with metadata
      const completeRes: any = await axios.post('http://localhost:3000/api/v1/s3/complete-multipart-upload', {
        uploadId,
        key,
        parts,
        fieldname: 'video', // optional: can be customized or passed in
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
      });

      return completeRes.data.body;
    } catch (err) {
      console.error('Upload failed:', err);
      throw err;
    }
  }
}
