'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, ArrowLeft, Upload, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import cabocilAPI from '@/apis/cabocil_api';
import { toast } from 'react-toastify';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    tags: [],
    type: 'default',
    active: false,
    original_pdf_url: '',
    access_tags: []
  });

  const [newTag, setNewTag] = useState('');
  const [newAccessTag, setNewAccessTag] = useState('');

  useEffect(() => {
    if (!params) {
      return
    }

    if (params.slug) {
      fetchBook();
    }
  }, [params]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const response = await cabocilAPI.GetBookDetail("", {}, { book_id: params.slug });

      if (!response.ok) {
        throw new Error('Failed to fetch book');
      }

      const result = await response.json();

      if (result.success && result.data) {
        result.data.cover_file_url = result.data.cover_file_url + `?ts=${Date.now()}`
        setBook(result.data);
        setFormData({
          book_id: result.data.id || 0,
          slug: result.data.slug || '',
          title: result.data.title || '',
          description: result.data.description || '',
          tags: result.data.tags || [],
          type: result.data.type || 'default',
          active: result.data.active || false,
          original_pdf_url: result.data.pdf_url || '',
          access_tags: result.data.access_tags || []
        });
        // Reset cover preview when book data is refreshed
        setCoverPreview(null);
      } else {
        throw new Error('Book not found');
      }
    } catch (err) {
      toast.error('Failed to load book: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addAccessTag = () => {
    if (newAccessTag.trim() && !formData.access_tags.includes(newAccessTag.trim())) {
      setFormData(prev => ({
        ...prev,
        access_tags: [...prev.access_tags, newAccessTag.trim()]
      }));
      setNewAccessTag('');
    }
  };

  const removeAccessTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      access_tags: prev.access_tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCoverFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload the cover
      uploadCover(file);
    }
  };

  const uploadCover = async (file) => {
    if (!book || !file) return;

    try {
      setUploadingCover(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('cover_file', file);
      formData.append('book_id', book.id)

      // Make the API call using fetch directly since we need to send FormData
      const response = await cabocilAPI.PatchUpdateBookCover("", {}, formData)

      if (!response.ok) {
        throw new Error('Failed to upload cover');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Book cover updated successfully!');
        // Refresh book data to get the new cover URL
        await fetchBook();
      } else {
        throw new Error(result.error?.message || 'Failed to update cover');
      }
    } catch (err) {
      toast.error('Failed to upload cover: ' + err.message);
      setCoverPreview(null); // Reset preview on error
    } finally {
      setUploadingCover(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!book) return;

    try {
      setSaving(true);

      const response = await cabocilAPI.PatchUpdateBook("", {}, formData)

      if (!response.ok) {
        throw new Error('Failed to update book');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh book data
        await fetchBook();
      } else {
        throw new Error(result.error?.message || 'Failed to update book');
      }
    } catch (err) {
      toast.error('Failed to save book: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading book...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Book not found</div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-4xl mx-auto px-4">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Book Preview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Book Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cover Image Section */}
                <div className="space-y-3">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : book.cover_file_url ? (
                      <img
                        src={book.cover_file_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera className="w-12 h-12" />
                      </div>
                    )}

                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={uploadingCover}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingCover ? 'Uploading...' : 'Update Cover'}
                  </Button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="hidden"
                  />

                  <p className="text-xs text-gray-500 text-center">
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">Book ID: {book.id}</p>
                  <p className="text-sm">Current Slug: {book.slug}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Book title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="book-slug"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <CardTitle>Book Information</CardTitle>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={saving || uploadingCover}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Book description"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf-url">Original PDF URL</Label>
                    <Input
                      id="pdf-url"
                      value={formData.original_pdf_url}
                      onChange={(e) => handleInputChange('original_pdf_url', e.target.value)}
                      placeholder="https://example.com/book.pdf"
                      type="url"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="default">Default</option>
                        <option value="workbook">Workbook</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => handleInputChange('active', checked)}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-4">
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-3">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag (e.g., level:A1, subject:math)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Access Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-3">
                        {formData.access_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {tag}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeAccessTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newAccessTag}
                          onChange={(e) => setNewAccessTag(e.target.value)}
                          placeholder="Add access tag (e.g., free, premium)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessTag())}
                        />
                        <Button type="button" onClick={addAccessTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}