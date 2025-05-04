import { Component } from '@angular/core';
import { S3UploadService } from '../services/s3-upload.service';
@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  progress = 0;

  constructor(private uploadService: S3UploadService) {}

  async handleFileInput(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.progress = 0;
      try {
        const result = await this.uploadService.uploadFile(file, (percent) => {
          this.progress = percent;
        });
        console.log('Upload success:', result);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  }

}
