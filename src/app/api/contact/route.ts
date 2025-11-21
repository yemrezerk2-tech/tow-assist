import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { sanitizeObject } from '@/lib/sanitize'

// Setup email service
const resend = new Resend(process.env.RESEND_API_KEY)
const contactFormEmail = process.env.CONTACT_EMAIL

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    

    const sanitizedData = sanitizeObject(requestData)
    
    console.log('=== PROCESSING CONTACT FORM ===')
    console.log('Sanitized Name:', sanitizedData.name)
    console.log('Sanitized Email:', sanitizedData.email)
    console.log('Has phone:', !!sanitizedData.phone)

    const currentTimestamp = Date.now()
    
    const contactData = {
      id: `CTN${currentTimestamp}`, 
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone || null, 
      message: sanitizedData.message,
      status: 'pending', 
      created_at: new Date().toISOString()
    }

    console.log('Generated contact ID:', contactData.id)

    const { data: savedContact, error: saveError } = await supabase
      .from('contact_requests')
      .insert([contactData])
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save contact to database:', saveError)
      throw saveError
    }

    console.log('Contact request saved successfully:', savedContact.id)

    try {
      console.log('Preparing notification email...')
      

      const emailSubject = `Neue Kontaktanfrage: ${sanitizedData.name}`
      const submissionTime = new Date().toLocaleString('de-DE')
      

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: #3b82f6; 
              color: white; 
              padding: 25px 20px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 8px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content { 
              padding: 30px 20px; 
            }
            .info-section { 
              margin-bottom: 25px; 
              padding: 20px; 
              background: #f8fafc; 
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .info-section h2 {
              margin-top: 0;
              color: #1e293b;
              font-size: 18px;
            }
            .field-label { 
              font-weight: bold; 
              color: #64748b;
              display: inline-block;
              min-width: 80px;
            }
            .field-value { 
              margin-bottom: 12px;
              padding: 5px 0;
            }
            .message-text { 
              white-space: pre-wrap;
              background: white;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              line-height: 1.5;
            }
            .footer {
              background: #f1f5f9;
              padding: 15px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>Neue Kontaktanfrage</h1>
              <p>Eingegangen am ${submissionTime}</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <h2>Kontaktinformation</h2>
                <div class="field-value">
                  <span class="field-label">Name:</span> 
                  ${sanitizedData.name}
                </div>
                <div class="field-value">
                  <span class="field-label">E-Mail:</span> 
                  <a href="mailto:${sanitizedData.email}" style="color: #3b82f6; text-decoration: none;">
                    ${sanitizedData.email}
                  </a>
                </div>
                ${sanitizedData.phone ? `
                <div class="field-value">
                  <span class="field-label">Telefon:</span> 
                  <a href="tel:${sanitizedData.phone}" style="color: #3b82f6; text-decoration: none;">
                    ${sanitizedData.phone}
                  </a>
                </div>
                ` : '<div class="field-value"><span class="field-label">Telefon:</span> Nicht angegeben</div>'}
              </div>
              
              <div class="info-section">
                <h2>Nachricht</h2>
                <div class="message-text">${sanitizedData.message}</div>
              </div>
              
              <div class="info-section">
                <h2>System Information</h2>
                <div class="field-value">
                  <span class="field-label">Request ID:</span> 
                  ${contactData.id}
                </div>
                <div class="field-value">
                  <span class="field-label">Status:</span> 
                  Pending Review
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch vom Kontaktformular generiert.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const { data: emailResponse, error: emailSendError } = await resend.emails.send({
        from: `Kontakt Formular <noreply@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`,
        to: [contactFormEmail!],
        subject: emailSubject,
        html: emailHtml,
      })

      if (emailSendError) {
        console.error('Email service error:', emailSendError)
      } else {
        console.log('Contact notification email sent successfully')
        console.log('Resend email ID:', emailResponse?.id)
      }
      
    } catch (emailException) {
      console.error('Email sending process completely failed:', emailException)
    }

    console.log('Contact form processing completed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Contact request submitted successfully',
      requestId: savedContact.id,
      contactName: sanitizedData.name, 
      submittedAt: savedContact.created_at,
      status: 'pending'
    })
    
  } catch (err) {
    console.error('Contact form submission error:', err)
    

    return NextResponse.json({ 
      error: 'Failed to submit contact request',
      reason: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}