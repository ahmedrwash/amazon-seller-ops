import { useState, useCallback } from 'react';
import { checkStorageRLSStatus, verifyBucketPolicies, testStorageAccess } from '@/utils/storageRLSDebug';
import { useToast } from '@/components/ui/use-toast';

export function useStoragePolicies() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const { toast } = useToast();

  const checkPoliciesExist = useCallback(async (bucketName) => {
    setLoading(true);
    try {
      const status = await checkStorageRLSStatus();
      const bucketAccess = await verifyBucketPolicies(bucketName);
      
      if (!bucketAccess) {
        toast({
          title: "Access Verification Failed",
          description: `Cannot list files in '${bucketName}'. RLS policies may be missing or blocking access.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const testFileUpload = useCallback(async (bucketName, testFileName = 'test-upload.txt') => {
    setLoading(true);
    try {
      const results = await testStorageAccess(bucketName, testFileName);
      setTestResults(prev => ({ ...prev, upload: results.upload }));
      
      if (results.upload) {
        toast({ title: "Upload Successful", description: "Write permissions are working correctly." });
        return true;
      } else {
        toast({ 
          title: "Upload Failed", 
          description: results.errors.upload || "Permission denied", 
          variant: "destructive" 
        });
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const testFileRead = useCallback(async (bucketName, fileName) => {
    setLoading(true);
    try {
      const results = await testStorageAccess(bucketName, fileName);
      // We are only interested in read result here
      
      if (results.read) {
        toast({ title: "Read Successful", description: "Read permissions are working correctly." });
        return true;
      } else {
        toast({ 
          title: "Read Failed", 
          description: results.errors.read || "Permission denied", 
          variant: "destructive" 
        });
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const testFileDelete = useCallback(async (bucketName, fileName) => {
    setLoading(true);
    try {
      const results = await testStorageAccess(bucketName, fileName);
      
      if (results.delete) {
        toast({ title: "Delete Successful", description: "Delete permissions are working correctly." });
        return true;
      } else {
        toast({ 
          title: "Delete Failed", 
          description: results.errors.delete || "Permission denied", 
          variant: "destructive" 
        });
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const runFullDiagnostic = useCallback(async (bucketName) => {
    setLoading(true);
    try {
      const debugInfo = await checkStorageRLSStatus();
      const crudResults = await testStorageAccess(bucketName, `diagnostic-${Date.now()}.txt`);
      
      setTestResults({
        debugInfo,
        crudResults
      });
      
      return { debugInfo, crudResults };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    testResults,
    checkPoliciesExist,
    testFileUpload,
    testFileRead,
    testFileDelete,
    runFullDiagnostic
  };
}