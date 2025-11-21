import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { sanitizeObject } from '@/lib/sanitize'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)
const partnershipEmailAddress = process.env.PARTNERSHIP_EMAIL

export async function POST(request: Request) {
  try {
    const submittedData = await request.json()
    
    // SANITIZE ALL INPUT DATA
    const sanitizedData = sanitizeObject(submittedData)
    
    console.log('=== NEW PARTNERSHIP REQUEST ===')
    console.log('Sanitized Company:', sanitizedData.companyName)
    console.log('Sanitized Contact:', sanitizedData.contactPerson)

    // Create partnership record - using timestamp for unique ID generation
    const timestamp = Date.now()
    const partnershipRecord = {
      id: `PTN${timestamp}`, // PTN prefix for Partnership
      company_name: sanitizedData.companyName,
      contact_person: sanitizedData.contactPerson,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      city: sanitizedData.address, // Note: field name mismatch but keeping for compatibility
      service_type: sanitizedData.serviceType,
      message: sanitizedData.message || '', // default to empty string if no message
      status: 'pending', // all new requests start as pending
      created_at: new Date().toISOString()
    }

    console.log('Inserting sanitized partnership data:', partnershipRecord)

    // Insert into database
    const { data: insertedData, error: dbError } = await supabase
      .from('partnership_requests')
      .insert([partnershipRecord])
      .select()
      .single()

    if (dbError) {
      console.error('Database insertion failed:', dbError)
      throw dbError
    }

    console.log('Partnership request saved to database successfully')

    // Send notification email - wrapped in try/catch so form can still succeed if email fails
    try {
      console.log('Attempting to send notification email...')
      
      const emailSubject = `Neue Partnerschaftsanfrage: ${sanitizedData.companyName}`
      const currentDateTime = new Date().toLocaleString('de-DE')
      
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .email-container { max-width: 600px; margin: 0 auto; }
            .header { 
              background: #f59e0b; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0;
            }
            .content { padding: 20px; background: white; }
            .info-section { 
              margin-bottom: 20px; 
              padding: 15px; 
              background: #f8fafc; 
              border-radius: 8px; 
              border-left: 4px solid #f59e0b;
            }
            .field-label { 
              font-weight: bold; 
              color: #64748b; 
              display: inline-block;
              min-width: 140px;
            }
            .field-value { margin-bottom: 10px; }
            .footer { 
              padding: 15px; 
              background: #f1f5f9; 
              text-align: center; 
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1 style="margin: 0;">Neue Partnerschaftsanfrage</h1>
              <p style="margin: 10px 0 0 0;">Eingegangen am ${currentDateTime}</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <h2 style="margin-top: 0; color: #1e293b;">Unternehmensinformation</h2>
                <div class="field-value">
                  <span class="field-label">Firmenname:</span> 
                  ${sanitizedData.companyName}
                </div>
                <div class="field-value">
                  <span class="field-label">Ansprechpartner:</span> 
                  ${sanitizedData.contactPerson}
                </div>
                <div class="field-value">
                  <span class="field-label">E-Mail:</span> 
                  <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a>
                </div>
                <div class="field-value">
                  <span class="field-label">Telefon:</span> 
                  <a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a>
                </div>
                <div class="field-value">
                  <span class="field-label">Stadt:</span> 
                  ${sanitizedData.address}
                </div>
              </div>
              
              <div class="info-section">
                <h2 style="margin-top: 0; color: #1e293b;">Service Informationen</h2>
                <div class="field-value">
                  <span class="field-label">Service-Typ:</span> 
                  ${sanitizedData.serviceType}
                </div>
              </div>
              
              ${sanitizedData.message ? `
              <div class="info-section">
                <h2 style="margin-top: 0; color: #1e293b;">Zusätzliche Nachricht</h2>
                <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                  ${sanitizedData.message.replace(/\n/g, '<br>')}
                </div>
              </div>
              ` : ''}
              
              <div class="info-section">
                <h2 style="margin-top: 0; color: #1e293b;">Weitere Details</h2>
                <div class="field-value">
                  <span class="field-label">Request ID:</span> 
                  ${partnershipRecord.id}
                </div>
                <div class="field-value">
                  <span class="field-label">Status:</span> 
                  Pending Review
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch vom Partnership Request System generiert.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const { data: emailResult, error: emailSendError } = await resend.emails.send({
        from: `Partnership Form <noreply@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`,
        to: [partnershipEmailAddress!],
        subject: emailSubject,
        html: emailTemplate,
      })

      if (emailSendError) {
        console.error('Email service returned error:', emailSendError)
      } else {
        console.log('Partnership notification email sent successfully!')
        console.log('Email ID:', emailResult?.id)
      }
      
    } catch (emailException) {
      console.error('Email sending process failed completely:', emailException)
    }

    console.log('Partnership request process completed successfully')

    // Return success response with the created record ID
    return NextResponse.json({ 
      success: true, 
      message: 'Partnership request submitted successfully',
      requestId: insertedData.id,
      companyName: sanitizedData.companyName,
      submittedAt: new Date().toISOString()
    })
    
  } catch (err) {
    console.error('Partnership form submission failed:', err)
    
    // Return error details for debugging
    return NextResponse.json({ 
      error: 'Failed to submit partnership request',
      details: err instanceof Error ? err.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}