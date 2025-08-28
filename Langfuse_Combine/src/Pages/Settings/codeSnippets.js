export const getCodeSnippets = ({ publicKey, secretKey, host }) => {
    const sk = secretKey ?? 'YOUR_SECRET_KEY';
    return {
    Python: `pip install langfuse

             from langfuse import Langfuse

             langfuse = Langfuse(
             secret_key="${sk}",
             public_key="${publicKey}",
             host="${host}"
             )`,
    'JS/TS': `npm install langfuse
            
             import { Langfuse } from "langfuse";
            
             const langfuse = new Langfuse({
               secretKey: "${sk}",
               publicKey: "${publicKey}",
               baseUrl: "${host}"
             });`,
    OpenAI: `The integration is a drop-in replacement for the OpenAI Python SDK. By changing the import, Langfuse will capture all LLM calls and send them to Langfuse asynchronously.
             
             pip install langfuse
             
             .env
             
             LANGFUSE_SECRET_KEY=${sk}
             LANGFUSE_PUBLIC_KEY=${publicKey}
             LANGFUSE_HOST=${host}
             
             # remove: import openai
             
             from langfuse.openai import openai`,

    Langchain: `pip install langfuse

                from langfuse import langfuse
                from langfuse.callback import CallbackHandler
                
                langfuse = langfuse(
                    public_key="${publicKey}",
                    secret_key="${sk}",
                    host="${host}"
                )
                
                langfuse_handler = CallbackHandler()
                
                # <Your LangChain code here>
                
                #Add handler to run/invoke/call/chat
                chain.invoke({"input": "<user_input>"}, config={"callbacks": [langfuse_handler]})
                `,

    'Langchain JS': `npm install langfuse-langchain

                     import { CallbackHandler } from "langfuse-langchain";

                     // Initialize Langfuse callback handler
                     const langfuseHandler = new CallbackHandler({
                       publicKey: "${publicKey}",
                       secretKey: "${sk}",
                       baseUrl: "${host}"
                     });
                     
                     // Your Langchain implementation
                     const chain = new LLMChain(...);
                    
                     // Add handler as callback when running the Langchain agent
                     await chain.invoke(
                       { input: "<user-input>" },
                       { callbacks: [langfuseHandler] }
                     );`
  };
};